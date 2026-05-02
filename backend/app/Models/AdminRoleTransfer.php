<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminRoleTransfer extends Model
{
    protected $fillable = [
        'from_user_id',
        'to_user_id',
        'approved_by_user_id',
        'effective_on',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'effective_on' => 'date',
        ];
    }

    public function fromUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    public function toUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }
}
