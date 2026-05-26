<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\BilleteraTransaccion;
use App\Models\BilleteraCategoria;

class BilleteraTransaccionController extends Controller
{
    // ── Categorías ────────────────────────────────────────────────────────────

    public function categorias(Request $request)
    {
        $categorias = BilleteraCategoria::where('user_id', $request->user()->id)
            ->orderBy('nombre')
            ->get();

        return response()->json(['categorias' => $categorias]);
    }

    public function storeCategoria(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:60',
            'color'  => 'nullable|string|max:7',
            'tipo'   => 'nullable|in:ingreso,egreso,ambos',
        ]);

        $categoria = BilleteraCategoria::create([
            'user_id' => $request->user()->id,
            'nombre'  => $data['nombre'],
            'color'   => $data['color']  ?? '#6366f1',
            'tipo'    => $data['tipo']   ?? 'ambos',
        ]);

        return response()->json(['categoria' => $categoria], 201);
    }

    public function updateCategoria(Request $request, BilleteraCategoria $categoria)
    {
        abort_if($categoria->user_id !== $request->user()->id, 403);

        $data = $request->validate([
            'nombre' => 'sometimes|string|max:60',
            'color'  => 'sometimes|string|max:7',
            'tipo'   => 'sometimes|in:ingreso,egreso,ambos',
        ]);

        $categoria->update($data);

        return response()->json(['categoria' => $categoria]);
    }

    public function destroyCategoria(Request $request, BilleteraCategoria $categoria)
    {
        abort_if($categoria->user_id !== $request->user()->id, 403);
        $categoria->delete();
        return response()->json(['message' => 'Categoría eliminada.']);
    }

    public function historial(Request $request)
{
    $hoy  = now();
    $mes  = (int) $request->query('mes',  $hoy->month);
    $anio = (int) $request->query('anio', $hoy->year);
 
    $transacciones = BilleteraTransaccion::where('user_id', $request->user()->id)
        ->where('mes',  $mes)
        ->where('anio', $anio)
        ->with('categoria')
        ->orderBy('fecha', 'desc')
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($t) {
            $t->fotos = collect($t->fotos ?? [])->map(fn($path) =>
                Storage::disk('public')->url($path)
            )->values();
            return $t;
        });
 
    $totalIngresos = $transacciones->where('tipo', 'ingreso')->sum('monto');
    $totalEgresos  = $transacciones->where('tipo', 'egreso')->sum('monto');
 
    return response()->json([
        'transacciones'  => $transacciones,
        'total_ingresos' => round((float) $totalIngresos, 2),
        'total_egresos'  => round((float) $totalEgresos,  2),
        'mes'            => $mes,
        'anio'           => $anio,
    ]);
}
    // ── Transacciones ─────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $transacciones = BilleteraTransaccion::where('user_id', $request->user()->id)
            ->with('categoria')
            ->orderBy('fecha', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get()
            ->map(function ($t) {
                $t->fotos = collect($t->fotos ?? [])->map(fn($path) =>
                    Storage::disk('public')->url($path)
                )->values();
                return $t;
            });

        return response()->json(['transacciones' => $transacciones]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'tipo'         => 'required|in:ingreso,egreso',
            'monto'        => 'required|numeric|min:0.01',
            'descripcion'  => 'nullable|string|max:255',
            'etiqueta'     => 'nullable|string|max:100',
            'fecha'        => 'required|date|before_or_equal:today',
            'categoria_id' => 'required|exists:billetera_categorias,id',
            'fotos'        => 'nullable|array|max:3',
            'fotos.*'      => 'image|mimes:jpeg,png,jpg,webp|max:4096',
        ]);

        $user      = $request->user();
        $billetera = $user->billetera;

        if (!$billetera) {
            return response()->json(['message' => 'Billetera no encontrada.'], 404);
        }

        // Verificar que la categoría pertenece al usuario
        $categoria = BilleteraCategoria::where('id', $data['categoria_id'])
            ->where('user_id', $user->id)
            ->first();

        if (!$categoria) {
            return response()->json(['message' => 'Categoría no válida.'], 422);
        }


        // Subir fotos
        $fotos = [];
        if ($request->hasFile('fotos')) {
            foreach ($request->file('fotos') as $foto) {
                $path    = $foto->store("billetera/{$user->id}", 'public');
                $fotos[] = $path;
            }
        }

        $fecha = \Carbon\Carbon::parse($data['fecha']);

        DB::transaction(function () use ($data, $user, $billetera, $fotos, $fecha) {
            BilleteraTransaccion::create([
                'user_id'      => $user->id,
                'billetera_id' => $billetera->id,
                'categoria_id' => $data['categoria_id'],
                'monto'        => $data['monto'],
                'tipo'         => $data['tipo'],
                'descripcion'  => $data['descripcion'] ?? null,
                'etiqueta'     => $data['etiqueta']    ?? null,
                'fotos'        => $fotos ?: null,
                'fecha'        => $fecha->toDateString(),
                'mes'          => $fecha->month,
                'anio'         => $fecha->year,
            ]);

            if ($data['tipo'] === 'ingreso') {
                $billetera->increment('saldo', $data['monto']);
            } else {
                $billetera->decrement('saldo', $data['monto']);
            }
        });

        $billetera->refresh();

        return response()->json([
            'message' => $data['tipo'] === 'ingreso' ? 'Ingreso registrado.' : 'Egreso registrado.',
            'saldo'   => $billetera->saldo,
        ]);
    }
}