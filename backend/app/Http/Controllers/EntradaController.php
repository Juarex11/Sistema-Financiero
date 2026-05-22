<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use App\Models\Entrada;
use App\Models\EntradaCategoria;
use App\Models\Billetera;
use App\Models\BilleteraMovimiento;
use Carbon\Carbon;

class EntradaController extends Controller
{
    // ── Billetera ─────────────────────────────────────────────────────────────

    public function billetera(Request $request)
    {
        $user      = $request->user();
        $billetera = $user->billetera ?? Billetera::create([
            'user_id' => $user->id,
            'saldo'   => 0,
            'moneda'  => $user->currency ?? 'PEN',
        ]);

        $movimientos = BilleteraMovimiento::where('user_id', $user->id)
            ->with('entrada')
            ->orderByDesc('fecha')
            ->orderByDesc('created_at')
            ->take(20)
            ->get();

        return response()->json([
            'billetera'    => $billetera,
            'movimientos'  => $movimientos,
        ]);
    }

    // ── Categorías ────────────────────────────────────────────────────────────

    public function categorias(Request $request)
    {
        return response()->json(
            $request->user()->entradaCategorias()->withCount('entradas')->get()
        );
    }
public function movimientos(Request $request)
{
    $anio = $request->query('anio', now()->year);

    $movimientos = BilleteraMovimiento::where('user_id', $request->user()->id)
        ->where('anio', $anio)
        ->where('tipo', 'entrada')
        ->whereNotNull('entrada_id')  // ← solo movimientos de entradas fijas
        ->with('entrada.categoria')
        ->orderBy('mes')
        ->orderByDesc('fecha')
        ->get()
        ->groupBy('mes');

    return response()->json($movimientos);
}
    public function storeCategoria(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:80',
            'color'  => 'nullable|string|max:7',
            'icono'  => 'nullable|string|max:40',
        ]);

        $cat = EntradaCategoria::create([
            ...$data,
            'user_id' => $request->user()->id,
            'color'   => $data['color'] ?? '#9333ea',
            'icono'   => $data['icono'] ?? 'DollarSign',
        ]);

        return response()->json(['message' => 'Categoría creada.', 'categoria' => $cat], 201);
    }

    public function updateCategoria(Request $request, EntradaCategoria $categoria)
    {
        if ($categoria->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $data = $request->validate([
            'nombre' => 'nullable|string|max:80',
            'color'  => 'nullable|string|max:7',
            'icono'  => 'nullable|string|max:40',
        ]);

        $categoria->update($data);
        return response()->json(['message' => 'Categoría actualizada.', 'categoria' => $categoria]);
    }

    public function destroyCategoria(Request $request, EntradaCategoria $categoria)
    {
        if ($categoria->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $categoria->delete();
        return response()->json(['message' => 'Categoría eliminada.']);
    }

    // ── Entradas ──────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $entradas = $request->user()->entradas()
            ->with('categoria')
            ->orderBy('dia_pago')
            ->get();

        return response()->json($entradas);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre'       => 'required|string|max:100',
            'descripcion'  => 'nullable|string|max:255',
            'monto'        => 'required|numeric|min:0.01',
            'moneda'       => 'nullable|string|size:3',
            'dia_pago'     => 'required|integer|min:1|max:31',
            'hora_pago'    => 'nullable|date_format:H:i',
            'inicio_desde' => 'nullable|in:actual,proximo',
            'categoria_id' => 'nullable|exists:entrada_categorias,id',
            'imagen'       => 'nullable|image|max:4096',
        ]);

        $user      = $request->user();
        $imagePath = null;

        if ($request->hasFile('imagen')) {
            $imagePath = $request->file('imagen')->store('entradas', 'public');
        }

        $entrada = Entrada::create([
            ...$data,
            'user_id' => $user->id,
            'moneda'  => $data['moneda'] ?? $user->currency ?? 'PEN',
            'imagen'  => $imagePath,
            'activo'  => true,
            'inicio_desde' => $data['inicio_desde'] ?? 'proximo',
        ]);

        // Si inicio_desde es actual y hoy ya pasó el dia_pago o es hoy → registrar ahora
        if (($data['inicio_desde'] ?? 'proximo') === 'actual') {
            $this->registrarMovimiento($user, $entrada);
        }

        return response()->json([
            'message' => 'Entrada creada.',
            'entrada' => $entrada->load('categoria'),
        ], 201);
    }

    public function update(Request $request, Entrada $entrada)
    {
        if ($entrada->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $data = $request->validate([
            'nombre'       => 'nullable|string|max:100',
            'descripcion'  => 'nullable|string|max:255',
            'monto'        => 'nullable|numeric|min:0.01',
            'dia_pago'     => 'nullable|integer|min:1|max:31',
            'hora_pago'    => 'nullable|date_format:H:i',
            'categoria_id' => 'nullable|exists:entrada_categorias,id',
            'activo'       => 'nullable|boolean',
        ]);

        if ($request->hasFile('imagen')) {
            if ($entrada->imagen) Storage::disk('public')->delete($entrada->imagen);
            $data['imagen'] = $request->file('imagen')->store('entradas', 'public');
        }

        $entrada->update($data);
        return response()->json([
            'message' => 'Entrada actualizada.',
            'entrada' => $entrada->load('categoria'),
        ]);
    }

    public function destroy(Request $request, Entrada $entrada)
    {
        if ($entrada->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        if ($entrada->imagen) Storage::disk('public')->delete($entrada->imagen);
        $entrada->delete();
        return response()->json(['message' => 'Entrada eliminada.']);
    }

    public function toggleActivo(Request $request, Entrada $entrada)
    {
        if ($entrada->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $entrada->update(['activo' => !$entrada->activo]);
        return response()->json([
            'message' => $entrada->activo ? 'Entrada activada.' : 'Entrada pausada.',
            'entrada' => $entrada,
        ]);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    public function registrarMovimiento($user, Entrada $entrada, ?Carbon $fecha = null): void
    {
        $hoy      = $fecha ?? now();
        $billetera = $user->billetera ?? Billetera::create([
            'user_id' => $user->id,
            'saldo'   => 0,
            'moneda'  => $user->currency ?? 'PEN',
        ]);

        // Evitar duplicado del mismo mes
        $existe = BilleteraMovimiento::where('user_id', $user->id)
            ->where('entrada_id', $entrada->id)
            ->where('mes', $hoy->month)
            ->where('anio', $hoy->year)
            ->exists();

        if ($existe) return;

        DB::transaction(function () use ($user, $entrada, $billetera, $hoy) {
            BilleteraMovimiento::create([
                'user_id'      => $user->id,
                'billetera_id' => $billetera->id,
                'entrada_id'   => $entrada->id,
                'monto'        => $entrada->monto,
                'moneda'       => $entrada->moneda,
                'tipo'         => 'entrada',
                'descripcion'  => $entrada->nombre,
                'fecha'        => $hoy->toDateString(),
                'hora'         => $entrada->hora_pago,
                'mes'          => $hoy->month,
                'anio'         => $hoy->year,
            ]);

            $billetera->sumar((float) $entrada->monto);
        });
    }
}