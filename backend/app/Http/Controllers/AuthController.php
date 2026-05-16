<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Models\User;

class AuthController extends Controller
{
    private function userArray(User $user): array
    {
        return [
            'id'       => $user->id,
            'name'     => $user->name,
            'email'    => $user->email,
            'role'     => $user->role,
            'photo'    => $user->photo
                            ? Storage::disk('public')->url($user->photo)
                            : null,
            'currency' => $user->currency ?? 'PEN',
            'cargo'    => $user->cargo    ?? null,   // ← único cambio
        ];
    }

public function login(Request $request)
{
    $request->validate([
        'email'    => 'required|email',
        'password' => 'required|string|min:6',
    ]);

    if (!Auth::attempt($request->only('email', 'password'))) {
        return response()->json(['message' => 'Credenciales incorrectas.'], 401);
    }

    /** @var User $user */
    $user  = Auth::user();
    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
        'token'                  => $token,
        'token_type'             => 'Bearer',
        'user'                   => $this->userArray($user),
        'onboarding_completado'  => $user->onboardingCompletado(), // ← NUEVO
    ]);
}

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Sesión cerrada correctamente.']);
    }

    public function me(Request $request)
    {
        return response()->json($this->userArray($request->user()));
    }
}