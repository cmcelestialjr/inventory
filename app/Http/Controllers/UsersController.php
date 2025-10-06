<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UsersRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsersController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('userRole');

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                ->orWhere('username', 'LIKE', "%{$search}%");
            });
        }

        $users = $query->paginate(10);

        return response()->json([
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'prev' => $users->previousPageUrl(),
                'next' => $users->nextPageUrl(),
            ]
        ]);
    }

    public function roles()
    {
        $query = UsersRole::get();

        return response()->json([
            'data' => $query,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'username' => 'required|string|unique:users',
            'password' => 'required|string',
            'role' => 'required|numeric|exists:users_roles,id',
        ]);

        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $user_id = $user->id;

        $insert = new User;
        $insert->name = $request->name;
        $insert->username = $request->username;
        $insert->password = Hash::make($request->password);
        $insert->user_role_id = $request->role;
        // $insert->updated_by = $user_id;
        // $insert->created_by = $user_id;
        $insert->save();

        return response()->json(['message' => 'success'], 201);

    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string',
            'username' => 'required|string',
            'password' => 'required|string',
            'role' => 'required|numeric|exists:users_roles,id',
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $user_id = $user->id;

        $checkUser = User::where('id','!=', $id)
            ->where('username',$request->username)->first();

        if ($checkUser) {
            return response()->json(['message' => 'Username already exists!'], 404);
        }

        User::where('id',$id)
            ->update([
            'name' => $request->name,
            'username' => $request->username,
            // 'password' => Hash::make($request->password),
            'user_role_id' => $request->role,
            // 'updated_by' => $user_id
        ]);

        return response()->json(['message' => 'User updated successfully']);
    }
}