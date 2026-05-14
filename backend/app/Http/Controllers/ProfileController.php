<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    /**
     * Devuelve los campos del usuario incluyendo la URL pública de la foto.
     */
    private function userResponse($user): array
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
            'cargo'    => $user->cargo    ?? null,   // ← nuevo
        ];
    }

    /**
     * PUT /api/me
     * Actualiza nombre, email, moneda y/o cargo.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name'     => 'sometimes|required|string|max:255',
            'email'    => 'sometimes|required|email|max:255|unique:users,email,' . $user->id,
            'currency' => 'sometimes|required|string|size:3',
            'cargo'    => 'sometimes|nullable|string|max:100',   // ← nuevo
        ]);

        $user->update($data);

        return response()->json($this->userResponse($user));
    }

    /**
     * POST /api/me/photo
     */
    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpg,jpeg,png,gif,webp|max:2048',
        ]);

        $user = $request->user();

        if ($user->photo) {
            Storage::disk('public')->delete($user->photo);
        }

        $path = $request->file('photo')->store('avatars', 'public');
        $user->update(['photo' => $path]);

        return response()->json($this->userResponse($user));
    }

    /**
     * DELETE /api/me/photo
     */
    public function removePhoto(Request $request)
    {
        $user = $request->user();

        if ($user->photo) {
            Storage::disk('public')->delete($user->photo);
        }

        $user->update(['photo' => null]);

        return response()->json($this->userResponse($user));
    }

    /**
     * PUT /api/me/password
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'current_password' => 'required|string',
            'password'         => ['required', 'confirmed', Password::min(6)],
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'La contraseña actual es incorrecta.',
            ], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);

        $user->tokens()
             ->where('id', '!=', $request->user()->currentAccessToken()->id)
             ->delete();

        return response()->json(['message' => 'Contraseña actualizada correctamente.']);
    }
}