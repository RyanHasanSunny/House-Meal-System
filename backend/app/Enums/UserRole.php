<?php

namespace App\Enums;

enum UserRole: string
{
    case SuperAdmin = 'super_admin';
    case Admin = 'admin';
    case Member = 'member';

    public function label(): string
    {
        return str($this->value)->replace('_', ' ')->title()->toString();
    }
}
