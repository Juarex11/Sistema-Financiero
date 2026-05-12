<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class IsAdmin
{
    /**
     * Permite el paso solo si el usuario tiene rol 'admin'.
     */
    public function handle(Request $request, Closure $next)
    {
        if ($request->user()?->role !== 'admin') {
            return response()->json([
                'message' => 'Acceso denegado. Solo administradores.',
            ], 403);
        }

        return $next($request);
    }
}
