<?php

namespace App\Models;

use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'username', 'email', 'phone', 'role', 'password', 'is_active', 'joined_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public function mealPlansCreated(): HasMany
    {
        return $this->hasMany(MealPlan::class, 'created_by');
    }

    public function groceryItemsAdded(): HasMany
    {
        return $this->hasMany(GroceryItem::class, 'added_by');
    }

    public function mealStatuses(): HasMany
    {
        return $this->hasMany(MealStatus::class);
    }

    public function adminTransfersFrom(): HasMany
    {
        return $this->hasMany(AdminRoleTransfer::class, 'from_user_id');
    }

    public function adminTransfersTo(): HasMany
    {
        return $this->hasMany(AdminRoleTransfer::class, 'to_user_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(MemberPayment::class);
    }

    public function paymentsRecorded(): HasMany
    {
        return $this->hasMany(MemberPayment::class, 'recorded_by');
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'joined_at' => 'date',
            'is_active' => 'boolean',
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
    }
}
