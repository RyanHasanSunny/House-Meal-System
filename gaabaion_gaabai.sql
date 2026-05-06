-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 05, 2026 at 08:50 PM
-- Server version: 10.11.15-MariaDB-cll-lve
-- PHP Version: 8.4.20

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `gaabaion_gaabai`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_role_transfers`
--

CREATE TABLE `admin_role_transfers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `from_user_id` bigint(20) UNSIGNED NOT NULL,
  `to_user_id` bigint(20) UNSIGNED NOT NULL,
  `approved_by_user_id` bigint(20) UNSIGNED NOT NULL,
  `effective_on` date NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_role_transfers`
--

INSERT INTO `admin_role_transfers` (`id`, `from_user_id`, `to_user_id`, `approved_by_user_id`, `effective_on`, `notes`, `created_at`, `updated_at`) VALUES
(2, 5, 6, 5, '2026-05-03', NULL, '2026-05-02 20:37:35', '2026-05-02 20:37:35'),
(3, 6, 5, 6, '2026-05-03', NULL, '2026-05-02 20:51:03', '2026-05-02 20:51:03');

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `grocery_catalog_items`
--

CREATE TABLE `grocery_catalog_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(120) NOT NULL,
  `category` varchar(80) DEFAULT NULL,
  `default_unit` varchar(30) DEFAULT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `grocery_catalog_items`
--

INSERT INTO `grocery_catalog_items` (`id`, `name`, `category`, `default_unit`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'Rice', 'Staples', 'kg', 1, 1, NULL, '2026-05-02 12:49:12', '2026-05-02 12:49:12'),
(2, 'Oil', 'Staples', 'liter', 2, 1, NULL, '2026-05-02 12:49:12', '2026-05-02 12:49:12'),
(3, 'Turmeric (Halud)', 'Masala', 'g', 3, 1, NULL, '2026-05-02 12:49:12', '2026-05-02 12:49:12'),
(4, 'Black Pepper (Marich)', 'Masala', 'g', 4, 1, NULL, '2026-05-02 12:49:12', '2026-05-02 12:49:12'),
(5, 'Cumin (Jira)', 'Masala', 'g', 5, 1, NULL, '2026-05-02 12:49:12', '2026-05-02 12:49:12'),
(6, 'Chicken', 'Protein', 'kg', 6, 1, NULL, '2026-05-02 12:49:12', '2026-05-02 12:49:12'),
(7, 'Fish', 'Protein', 'kg', 7, 1, NULL, '2026-05-02 12:49:12', '2026-05-02 12:49:12'),
(8, 'Egg', 'Protein', 'piece', 8, 1, NULL, '2026-05-02 12:49:12', '2026-05-02 12:49:12'),
(9, 'Potato', 'Vegetable', 'kg', 9, 1, NULL, '2026-05-02 12:49:12', '2026-05-02 12:49:12');

-- --------------------------------------------------------

--
-- Table structure for table `grocery_items`
--

CREATE TABLE `grocery_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `meal_plan_id` bigint(20) UNSIGNED DEFAULT NULL,
  `member_id` bigint(20) UNSIGNED DEFAULT NULL,
  `grocery_catalog_item_id` bigint(20) UNSIGNED DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT 1.00,
  `unit` varchar(255) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `purchased_on` date NOT NULL,
  `notes` text DEFAULT NULL,
  `added_by` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `grocery_items`
--

INSERT INTO `grocery_items` (`id`, `meal_plan_id`, `member_id`, `grocery_catalog_item_id`, `title`, `category`, `quantity`, `unit`, `price`, `purchased_on`, `notes`, `added_by`, `created_at`, `updated_at`) VALUES
(1, 1, 5, 1, 'Rice', 'Staples', 1.00, 'kg', 85.00, '2026-05-01', NULL, 5, '2026-05-02 13:33:13', '2026-05-02 13:33:13'),
(2, 1, 5, 7, 'Fish', 'Protein', 1.50, 'kg', 460.00, '2026-05-01', NULL, 5, '2026-05-02 13:34:43', '2026-05-02 13:34:43'),
(3, 1, 5, NULL, 'vegetable', NULL, 1.00, 'kg', 30.00, '2026-05-01', NULL, 5, '2026-05-02 13:35:19', '2026-05-02 13:35:19'),
(4, 1, 5, 2, 'Oil', 'Staples', 1.00, 'liter', 100.00, '2026-05-02', NULL, 1, '2026-05-02 18:34:34', '2026-05-02 18:34:34'),
(5, 1, 5, 8, 'Egg', 'Protein', 1.00, 'dozen', 140.00, '2026-05-02', NULL, 1, '2026-05-02 18:35:00', '2026-05-02 18:35:00'),
(6, 1, 5, 1, 'Rice', 'Staples', 2.00, 'kg', 170.00, '2026-05-02', NULL, 1, '2026-05-02 18:35:29', '2026-05-02 18:35:29'),
(8, 1, 5, 9, 'Potato', 'Vegetable', 2.00, 'kg', 40.00, '2026-05-03', NULL, 5, '2026-05-03 17:35:47', '2026-05-03 17:35:47'),
(9, 1, 5, NULL, 'Onion', NULL, 1.00, 'kg', 40.00, '2026-05-03', NULL, 5, '2026-05-03 17:36:26', '2026-05-03 17:36:26'),
(10, 1, 5, NULL, 'Garlic', NULL, 1.00, 'kg', 100.00, '2026-05-03', NULL, 5, '2026-05-03 17:36:54', '2026-05-03 17:36:54'),
(11, 1, 5, NULL, 'Vegetables', NULL, 1.00, 'pcs', 50.00, '2026-05-03', NULL, 5, '2026-05-03 17:38:16', '2026-05-03 17:38:16'),
(12, 1, 5, 6, 'Chicken', 'Protein', 1.80, 'kg', 330.00, '2026-05-03', NULL, 5, '2026-05-03 17:49:07', '2026-05-03 17:49:07'),
(13, 1, 5, 1, 'Rice', 'Staples', 5.00, 'kg', 425.00, '2026-05-04', NULL, 5, '2026-05-04 20:36:23', '2026-05-04 20:36:23'),
(14, 1, 5, 8, 'Egg', 'Protein', 1.00, 'dozen', 135.00, '2026-05-04', NULL, 5, '2026-05-04 20:37:20', '2026-05-04 20:37:20'),
(15, 1, 5, 2, 'Oil', 'Staples', 1.00, 'liter', 205.00, '2026-05-04', NULL, 5, '2026-05-04 20:37:48', '2026-05-04 20:37:48');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` smallint(5) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `meal_plans`
--

CREATE TABLE `meal_plans` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `meal_plans`
--

INSERT INTO `meal_plans` (`id`, `name`, `type`, `start_date`, `end_date`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'Weekly Plan starting May 2, 2026', 'weekly', '2026-05-02', '2026-05-08', NULL, 5, '2026-05-02 13:32:36', '2026-05-02 13:32:36');

-- --------------------------------------------------------

--
-- Table structure for table `meal_statuses`
--

CREATE TABLE `meal_statuses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `meal_plan_id` bigint(20) UNSIGNED NOT NULL,
  `meal_date` date NOT NULL,
  `skip_lunch` tinyint(1) NOT NULL DEFAULT 0,
  `skip_dinner` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `meal_statuses`
--

INSERT INTO `meal_statuses` (`id`, `user_id`, `meal_plan_id`, `meal_date`, `skip_lunch`, `skip_dinner`, `created_at`, `updated_at`) VALUES
(1, 2, 1, '2026-05-02', 0, 0, '2026-05-02 13:32:36', '2026-05-02 13:32:36'),
(2, 2, 1, '2026-05-03', 0, 0, '2026-05-02 13:32:36', '2026-05-02 13:32:36'),
(3, 2, 1, '2026-05-04', 0, 0, '2026-05-02 13:32:36', '2026-05-02 13:32:36'),
(4, 2, 1, '2026-05-05', 0, 0, '2026-05-02 13:32:36', '2026-05-02 13:32:36'),
(5, 2, 1, '2026-05-06', 0, 0, '2026-05-02 13:32:36', '2026-05-02 13:32:36'),
(6, 2, 1, '2026-05-07', 0, 0, '2026-05-02 13:32:36', '2026-05-02 13:32:36'),
(7, 2, 1, '2026-05-08', 0, 0, '2026-05-02 13:32:36', '2026-05-02 13:32:36'),
(8, 3, 1, '2026-05-02', 0, 0, '2026-05-02 13:32:36', '2026-05-02 13:32:36'),
(9, 3, 1, '2026-05-03', 0, 0, '2026-05-02 13:32:36', '2026-05-02 13:32:36'),
(10, 3, 1, '2026-05-04', 0, 0, '2026-05-02 13:32:36', '2026-05-02 13:32:36'),
(11, 3, 1, '2026-05-05', 0, 0, '2026-05-02 13:32:36', '2026-05-02 13:32:36'),
(12, 3, 1, '2026-05-06', 0, 0, '2026-05-02 13:32:36', '2026-05-02 13:32:36'),
(13, 3, 1, '2026-05-07', 0, 0, '2026-05-02 13:32:36', '2026-05-02 13:32:36'),
(14, 3, 1, '2026-05-08', 0, 0, '2026-05-02 13:32:36', '2026-05-02 13:32:36'),
(15, 4, 1, '2026-05-02', 1, 0, '2026-05-02 13:32:36', '2026-05-02 13:32:36'),
(16, 4, 1, '2026-05-03', 1, 0, '2026-05-02 13:32:36', '2026-05-02 18:56:23'),
(17, 4, 1, '2026-05-04', 1, 0, '2026-05-02 13:32:36', '2026-05-03 17:47:02'),
(18, 4, 1, '2026-05-05', 1, 0, '2026-05-02 13:32:36', '2026-05-05 05:01:22'),
(19, 4, 1, '2026-05-06', 0, 0, '2026-05-02 13:32:36', '2026-05-03 17:47:11'),
(20, 4, 1, '2026-05-07', 0, 0, '2026-05-02 13:32:36', '2026-05-03 17:47:15'),
(21, 4, 1, '2026-05-08', 0, 0, '2026-05-02 13:32:36', '2026-05-03 17:47:19'),
(22, 5, 1, '2026-05-02', 0, 0, '2026-05-02 13:32:36', '2026-05-02 20:51:03'),
(23, 5, 1, '2026-05-03', 1, 0, '2026-05-02 13:32:36', '2026-05-02 20:51:03'),
(24, 5, 1, '2026-05-04', 1, 0, '2026-05-02 13:32:36', '2026-05-03 18:20:16'),
(25, 5, 1, '2026-05-05', 0, 0, '2026-05-02 13:32:36', '2026-05-02 20:51:03'),
(26, 5, 1, '2026-05-06', 0, 0, '2026-05-02 13:32:36', '2026-05-02 20:51:03'),
(27, 5, 1, '2026-05-07', 0, 0, '2026-05-02 13:32:36', '2026-05-02 20:51:03'),
(28, 5, 1, '2026-05-08', 0, 0, '2026-05-02 13:32:36', '2026-05-02 20:51:03'),
(29, 6, 1, '2026-05-02', 0, 1, '2026-05-02 13:32:36', '2026-05-02 20:51:03'),
(30, 6, 1, '2026-05-03', 1, 0, '2026-05-02 13:32:36', '2026-05-03 01:36:35'),
(31, 6, 1, '2026-05-04', 1, 0, '2026-05-02 13:32:36', '2026-05-04 00:57:55'),
(32, 6, 1, '2026-05-05', 1, 0, '2026-05-02 13:32:36', '2026-05-04 23:38:54'),
(33, 6, 1, '2026-05-06', 0, 0, '2026-05-02 13:32:36', '2026-05-02 20:51:03'),
(34, 6, 1, '2026-05-07', 0, 0, '2026-05-02 13:32:36', '2026-05-02 20:51:03'),
(35, 6, 1, '2026-05-08', 0, 0, '2026-05-02 13:32:36', '2026-05-02 20:51:03');

-- --------------------------------------------------------

--
-- Table structure for table `member_payments`
--

CREATE TABLE `member_payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `grocery_item_id` bigint(20) UNSIGNED DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `paid_on` date NOT NULL,
  `notes` text DEFAULT NULL,
  `recorded_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `member_payments`
--

INSERT INTO `member_payments` (`id`, `user_id`, `grocery_item_id`, `amount`, `paid_on`, `notes`, `recorded_by`, `created_at`, `updated_at`) VALUES
(1, 5, 1, 85.00, '2026-05-01', 'Grocery: Rice', 5, '2026-05-02 13:33:13', '2026-05-02 13:33:13'),
(2, 5, 2, 460.00, '2026-05-01', 'Grocery: Fish', 5, '2026-05-02 13:34:43', '2026-05-02 13:34:43'),
(3, 5, 3, 30.00, '2026-05-01', 'Grocery: vegetable', 5, '2026-05-02 13:35:19', '2026-05-02 13:35:19'),
(4, 5, 4, 100.00, '2026-05-02', 'Grocery: Oil', 1, '2026-05-02 18:34:34', '2026-05-02 18:34:34'),
(5, 5, 5, 140.00, '2026-05-02', 'Grocery: Egg', 1, '2026-05-02 18:35:00', '2026-05-02 18:35:00'),
(6, 5, 6, 170.00, '2026-05-02', 'Grocery: Rice', 1, '2026-05-02 18:35:29', '2026-05-02 18:35:29'),
(8, 5, 8, 40.00, '2026-05-03', 'Grocery: Potato', 5, '2026-05-03 17:35:47', '2026-05-03 17:35:47'),
(9, 5, 9, 40.00, '2026-05-03', 'Grocery: Onion', 5, '2026-05-03 17:36:26', '2026-05-03 17:36:26'),
(10, 5, 10, 100.00, '2026-05-03', 'Grocery: Garlic', 5, '2026-05-03 17:36:54', '2026-05-03 17:36:54'),
(11, 5, 11, 50.00, '2026-05-03', 'Grocery: Vegetables', 5, '2026-05-03 17:38:16', '2026-05-03 17:38:16'),
(12, 5, 12, 330.00, '2026-05-03', 'Grocery: Chicken', 5, '2026-05-03 17:49:07', '2026-05-03 17:49:07'),
(13, 5, 13, 425.00, '2026-05-04', 'Grocery: Rice', 5, '2026-05-04 20:36:23', '2026-05-04 20:36:23'),
(14, 5, 14, 135.00, '2026-05-04', 'Grocery: Egg', 5, '2026-05-04 20:37:20', '2026-05-04 20:37:20'),
(15, 5, 15, 205.00, '2026-05-04', 'Grocery: Oil', 5, '2026-05-04 20:37:48', '2026-05-04 20:37:48');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2026_05_01_191229_create_grocery_items_table', 1),
(5, '2026_05_01_191229_create_meal_plans_table', 1),
(6, '2026_05_01_191229_create_meal_statuses_table', 1),
(7, '2026_05_01_191500_create_personal_access_tokens_table', 1),
(8, '2026_05_02_104503_create_admin_role_transfers_table', 1),
(9, '2026_05_02_104700_add_meal_plan_id_to_grocery_items_table', 1),
(10, '2026_05_02_160000_create_grocery_catalog_items_table', 1),
(11, '2026_05_02_160100_add_grocery_catalog_item_id_to_grocery_items_table', 1),
(12, '2026_05_02_180000_create_member_payments_table', 1),
(13, '2026_05_02_190000_add_member_id_to_grocery_items_table', 1),
(14, '2026_05_02_200000_add_grocery_item_id_to_member_payments_table', 1);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(8, 'App\\Models\\User', 6, 'jihadulislam-1777731028', '10e00269d86cd3788eae88c5477ccbc73557be374a1cce61ac6640e882bd4526', '[\"*\"]', '2026-05-02 18:22:55', NULL, '2026-05-02 14:10:28', '2026-05-02 18:22:55'),
(9, 'App\\Models\\User', 6, 'jihadulislam-1777731217', '879a7483ae2ae9da3c322bb067f81556dec28503d000d96ff1e4c67bb75eba25', '[\"*\"]', '2026-05-04 23:41:18', NULL, '2026-05-02 14:13:37', '2026-05-04 23:41:18'),
(11, 'App\\Models\\User', 3, 'hasibtalukder-1777731328', '66d5580a05830e9b775ef8a4c7c517ce8ab7380d41fd8979da830a04f42c8fa9', '[\"*\"]', '2026-05-05 06:28:46', NULL, '2026-05-02 14:15:28', '2026-05-05 06:28:46'),
(16, 'App\\Models\\User', 4, 'jisanhawlader-1777748156', '551bb00f5bea75c6a7c82c3bf6645accf936195e86e7abe5c55aa639f189eb84', '[\"*\"]', '2026-05-05 05:01:22', NULL, '2026-05-02 18:55:56', '2026-05-05 05:01:22'),
(17, 'App\\Models\\User', 2, 'fahadhossain-1777748191', 'ad01028c0467a6f06c2f6d5bb1086b9f857526224285a50a8eeee819ee09d6b2', '[\"*\"]', '2026-05-02 19:25:29', NULL, '2026-05-02 18:56:31', '2026-05-02 19:25:29'),
(18, 'App\\Models\\User', 2, 'fahadhossain-1777748228', '0219f282d8d2a539ca5632fe54bc1956c7e0efb836fa3df21736d362b994ddc6', '[\"*\"]', '2026-05-02 19:02:32', NULL, '2026-05-02 18:57:08', '2026-05-02 19:02:32'),
(21, 'App\\Models\\User', 6, 'jihadulislam-1777749086', '9bcc2efac9fe23b290a5e373550ab712b30958479cc33a57807c3bfeaa176133', '[\"*\"]', '2026-05-02 20:51:13', NULL, '2026-05-02 19:11:26', '2026-05-02 20:51:13'),
(24, 'App\\Models\\User', 5, 'ryanhasan-1777792482', 'b1a0d673a23641c96d9e84f2a45b21db80db2ed891db8b345e3f4c1b3fe38231', '[\"*\"]', '2026-05-05 13:48:55', NULL, '2026-05-03 07:14:42', '2026-05-05 13:48:55'),
(25, 'App\\Models\\User', 5, 'ryanhasan-1777792600', '40d3d7d4cccc8237a03e4f38a366f228f5b6fb04f3462fdb80276a8d4641f4f4', '[\"*\"]', '2026-05-03 07:33:11', NULL, '2026-05-03 07:16:40', '2026-05-03 07:33:11'),
(27, 'App\\Models\\User', 5, 'ryanhasan-1777800975', '424eba91fb2e7803814cd8a0b76951a82e6d72bd4f620044726f9cce748ff4b6', '[\"*\"]', '2026-05-05 03:34:43', NULL, '2026-05-03 09:36:15', '2026-05-05 03:34:43');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('3YUJvKeylshWyJmUCPcmHIFLneQ6qdkrz9bDsDSQ', NULL, '54.152.28.140', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36', 'eyJfdG9rZW4iOiJJZzVpT0VMNlo3MURQMFRudjJMazRPY1RkTlA4U2tTaDlWRE9IOUZjIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHBzOlwvXC93d3cuYXBpLmdhYWJhaS5vbmxpbmUiLCJyb3V0ZSI6bnVsbH0sIl9mbGFzaCI6eyJvbGQiOltdLCJuZXciOltdfX0=', 1777977047),
('9h0QiWjChvcWEB1Z1bp2KE3R49TFJ1rMcpclsJvs', NULL, '149.57.180.198', 'Mozilla/5.0 (X11; Linux i686; rv:109.0) Gecko/20100101 Firefox/120.0', 'eyJfdG9rZW4iOiJiVjhHVkkxSXFqN0F3QVFqZkttZ25KaEdJWmtRalpteHpQcDBlUERlIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHBzOlwvXC93d3cuYXBpLmdhYWJhaS5vbmxpbmUiLCJyb3V0ZSI6bnVsbH0sIl9mbGFzaCI6eyJvbGQiOltdLCJuZXciOltdfX0=', 1777914461),
('D9B4zAhNMageK5F3FfoCQ88flrMLz1RMmnW4Fkh1', NULL, '45.92.84.52', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36', 'eyJfdG9rZW4iOiJOaExlSDZ6YjhLbmluV1YzT1hpUXFSSDZPZXZZa2FpMzNOczZGaFB2IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL3d3dy5hcGkuZ2FhYmFpLm9ubGluZSIsInJvdXRlIjpudWxsfSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1777929665),
('g057uRQLiYwLX5s9jdSn9AqSRDA62pIIRh2JMhT6', NULL, '35.240.212.249', 'Mozilla/5.0 (Linux; Android 13; SM-A515F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36', 'eyJfdG9rZW4iOiJtaHRQb3ZreEdQaW9XSU5uVzd4bUtIbjRQNDhYVzdyWVBOTHgyQ1J2IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2FwaS5nYWFiYWkub25saW5lIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1777914081),
('H9rgat8iLEikm3nfKAouHnjO6LztyepsTwJksUrA', NULL, '45.92.86.144', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36', 'eyJfdG9rZW4iOiJQUmVBUmN3c0xvWTdYaFN4Q0pDTGZLSzlacHgxM0hFV0dQbUc4QmxoIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHBzOlwvXC9hcGkuZ2FhYmFpLm9ubGluZSIsInJvdXRlIjpudWxsfSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1777925926),
('itpxso81dTb7n0H9l8xTEZwwCVQ4Jayb1PdnY4bb', NULL, '45.92.84.192', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36', 'eyJfdG9rZW4iOiJBajJWNE92MXdDYmk5VnpCVTNmWndUbmc1bjU1N1hkcFcyNTdqdXVnIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2FwaS5nYWFiYWkub25saW5lIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1777925925),
('k4PLdejXgKqa6oJ6ZhX7PwHAPxOPGQmoZnPH8zws', NULL, '149.57.180.80', 'Mozilla/5.0 (X11; Linux i686; rv:109.0) Gecko/20100101 Firefox/120.0', 'eyJfdG9rZW4iOiJOaktWTDJZbGp1QkZNTURYREZPVTJxWUJKazRLdGhhbkpFUzl5eHpFIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHBzOlwvXC9hcGkuZ2FhYmFpLm9ubGluZSIsInJvdXRlIjpudWxsfSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1777914571),
('SqCeCH7Bk3l9NKEjGA7S4izw9GGtMC1plgFydYvp', NULL, '91.184.244.208', 'Mozilla/5.0 (iPad; CPU OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Mobile/11A465', 'eyJfdG9rZW4iOiJ6UDA0RnpyMExDa2VJbjZobWg2Y1pLRkNHV1RPWFZGbUxhcTJDWEVhIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHBzOlwvXC9hcGkuZ2FhYmFpLm9ubGluZSIsInJvdXRlIjpudWxsfSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1777981753),
('tsRCUt5bFJvQDvUWmCtpIjSHZOAWZYwG4S7zMHb0', NULL, '91.184.244.208', 'Mozilla/5.0 (iPad; CPU OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Mobile/11A465', 'eyJfdG9rZW4iOiIzY1dSQlRHUTFSNDJMS2RpRURTMEpJUGJHY001ZUtCM2ZGSjZRUXM0IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2FwaS5nYWFiYWkub25saW5lIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1777981754),
('Tx5RhSPVSaOBf2dgOCn78YW87X8GvjUhtzNhMYgm', NULL, '154.28.229.231', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJtTWhjaUU5UkFTaEo5amlQNmtXcEFhNXU4SUVMY1Nwbk4xZG1iZnlzIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHBzOlwvXC9hcGkuZ2FhYmFpLm9ubGluZSIsInJvdXRlIjpudWxsfSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1777958600),
('U2Li1K6lIMpDcyDrc0sEDX6qtbvszvUnnoacHWnf', NULL, '168.144.124.93', 'Mozilla/5.0 (X11; Linux x86_64; rv:142.0) Gecko/20100101 Firefox/142.0', 'eyJfdG9rZW4iOiJpRjBnbWVJNTJpaDB4SnRQb2RRSWRuY0ZtS2tZblVWS1lpZVpYV2tTIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2FwaS5nYWFiYWkub25saW5lIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1777919249),
('UaSyR5sUsqI2sRwZGQbunGE1RO5Tdel0S4Bs2Oy8', NULL, '35.199.38.207', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36', 'eyJfdG9rZW4iOiJKa2Mxc2QxNEZ2aDB6MXVlZlVRdGRaZGhROXdseWtpSUM4ZG5Ta3NGIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2FwaS5nYWFiYWkub25saW5lIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1777987646),
('V89GkhoFqLRz8BpzIHovf6vn90NHaVpc0dCf7syE', NULL, '168.144.124.93', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJnYVRyTVZ0alVVd2FTSUZlRW82MmxhWmV2dzJUQTY0VkE5T3FzdkhjIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHBzOlwvXC9hcGkuZ2FhYmFpLm9ubGluZSIsInJvdXRlIjpudWxsfSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1777919250),
('w1599JOLtl1zc4opuJy8yQ01YQqPzlk8vL9s5aPx', NULL, '34.71.100.55', 'Mozilla/5.0 (compatible; CMS-Checker/1.0; +https://example.com)', 'eyJfdG9rZW4iOiJza1BVSE5MaUZYWkhrYWtkY0NIOWRXNEZGWnJjc21tVWtjQ0hkUkZjIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2FwaS5nYWFiYWkub25saW5lIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1777910214),
('w77mJZq9X47eLxqB04tPfDNAGy2StcUk2Sm6XVaa', NULL, '45.92.85.221', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36', 'eyJfdG9rZW4iOiIxRE56cklsWDNaaDd0TTd0MnJlSlBPRDV5Rjd4QTV0aW9FOG5XRjRwIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHBzOlwvXC93d3cuYXBpLmdhYWJhaS5vbmxpbmUiLCJyb3V0ZSI6bnVsbH0sIl9mbGFzaCI6eyJvbGQiOltdLCJuZXciOltdfX0=', 1777929667),
('wjWPfxfuVX6XT1L9I2VU3T2HFHVMVkAswSUOdqj4', NULL, '154.28.229.231', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJudXN1Q3kxc2hBalk5S1BxZGlyUm4yQU4zQWJpQnhwZUVLNzl6VDc2IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHBzOlwvXC9hcGkuZ2FhYmFpLm9ubGluZSIsInJvdXRlIjpudWxsfSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1777958601),
('WW4mLwsFcABwBhjkZKZubtorEebBynWptwyA51l1', NULL, '34.44.42.241', 'Mozilla/5.0 (compatible; CMS-Checker/1.0; +https://example.com)', 'eyJfdG9rZW4iOiJURkFKYVR4T3hTQ2RhZ0FCcTJCRXNzcFAxZENzc3ZYb0dqaDFmUkdHIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL3d3dy5hcGkuZ2FhYmFpLm9ubGluZSIsInJvdXRlIjpudWxsfSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1777910330),
('Xpw9q8MdpC9tMvkgEumDWDHVf159ETZiae0Wvrig', NULL, '104.164.126.89', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiI5TjZMbEJHQk1QQTNNeTkyeVQ5dmg3cGRnOTNKNnM3TDhBSlpWbGpNIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHBzOlwvXC9hcGkuZ2FhYmFpLm9ubGluZSIsInJvdXRlIjpudWxsfSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1777958600);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'member',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `joined_at` date DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `username`, `email`, `phone`, `role`, `is_active`, `joined_at`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Super Admin', 'superadmin', 'admin@gaabai.online', '01799340834', 'super_admin', 1, '2026-05-02', NULL, '$2y$12$8iIFuD4CBNyl2FV9ZLsixe56TB1bHVVWniZWw.GISu93Y9cD3Lr7i', NULL, '2026-05-02 13:10:41', '2026-05-02 13:10:41'),
(2, 'MD Fahad Hossain', 'fahadhossain', NULL, '+880 1968-322522', 'member', 1, '2026-05-02', NULL, '$2y$12$7Ef7Lue5NCvvffgGMd.Wj.2oc8o.70mlgxZ6gxrLeQaMMvkM/OHky', NULL, '2026-05-02 13:13:49', '2026-05-02 13:13:49'),
(3, 'MD: Hasib Talukder', 'hasibtalukder', NULL, '+880 1641-507733', 'member', 1, '2026-05-02', NULL, '$2y$12$F//kPwkxaNAE0T9N8hq/.ur3kgzsUGmISr36ZYrVkSQChw7cIaVza', NULL, '2026-05-02 13:18:32', '2026-05-02 13:18:32'),
(4, 'Jisan Hawlader', 'jisanhawlader', NULL, '+880 1712-812563', 'member', 1, '2026-05-02', NULL, '$2y$12$ZAcqbfJURsD9aeCr0qwPrOAMB7kt2.EHVn3BqHzTCB210f4vPX2Ea', NULL, '2026-05-02 13:20:44', '2026-05-02 13:20:44'),
(5, 'Ryan Hasan Sunny', 'ryanhasan', 'ryanhasansunny31@gmail.com', '01799340834', 'admin', 1, '2026-05-02', NULL, '$2y$12$BTVD8dhs6EQA0lm2..kp.Olw9ntyeAwFDey593SnriLBI7QXfpSFC', NULL, '2026-05-02 13:22:22', '2026-05-03 09:37:02'),
(6, 'Jahidul Islam', 'jihadulislam', 'jahidulislam842487@gmail.com', '+880 1314-842487', 'member', 1, '2026-05-02', NULL, '$2y$12$8N/1clvwkhd2uoPpulvwy.Gao1HML6kPFFQxFuTj1R.PdVeo/ideC', NULL, '2026-05-02 13:26:18', '2026-05-03 01:39:21');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_role_transfers`
--
ALTER TABLE `admin_role_transfers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admin_role_transfers_from_user_id_foreign` (`from_user_id`),
  ADD KEY `admin_role_transfers_to_user_id_foreign` (`to_user_id`),
  ADD KEY `admin_role_transfers_approved_by_user_id_foreign` (`approved_by_user_id`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `grocery_catalog_items`
--
ALTER TABLE `grocery_catalog_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `grocery_catalog_items_created_by_foreign` (`created_by`);

--
-- Indexes for table `grocery_items`
--
ALTER TABLE `grocery_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `grocery_items_added_by_foreign` (`added_by`),
  ADD KEY `grocery_items_meal_plan_id_foreign` (`meal_plan_id`),
  ADD KEY `grocery_items_grocery_catalog_item_id_foreign` (`grocery_catalog_item_id`),
  ADD KEY `grocery_items_member_id_foreign` (`member_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `meal_plans`
--
ALTER TABLE `meal_plans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `meal_plans_created_by_foreign` (`created_by`);

--
-- Indexes for table `meal_statuses`
--
ALTER TABLE `meal_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `meal_statuses_user_id_meal_date_unique` (`user_id`,`meal_date`),
  ADD KEY `meal_statuses_meal_plan_id_foreign` (`meal_plan_id`);

--
-- Indexes for table `member_payments`
--
ALTER TABLE `member_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `member_payments_user_id_foreign` (`user_id`),
  ADD KEY `member_payments_recorded_by_foreign` (`recorded_by`),
  ADD KEY `member_payments_grocery_item_id_foreign` (`grocery_item_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_username_unique` (`username`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_role_transfers`
--
ALTER TABLE `admin_role_transfers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `grocery_catalog_items`
--
ALTER TABLE `grocery_catalog_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `grocery_items`
--
ALTER TABLE `grocery_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `meal_plans`
--
ALTER TABLE `meal_plans`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `meal_statuses`
--
ALTER TABLE `meal_statuses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT for table `member_payments`
--
ALTER TABLE `member_payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_role_transfers`
--
ALTER TABLE `admin_role_transfers`
  ADD CONSTRAINT `admin_role_transfers_approved_by_user_id_foreign` FOREIGN KEY (`approved_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `admin_role_transfers_from_user_id_foreign` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `admin_role_transfers_to_user_id_foreign` FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `grocery_catalog_items`
--
ALTER TABLE `grocery_catalog_items`
  ADD CONSTRAINT `grocery_catalog_items_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `grocery_items`
--
ALTER TABLE `grocery_items`
  ADD CONSTRAINT `grocery_items_added_by_foreign` FOREIGN KEY (`added_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `grocery_items_grocery_catalog_item_id_foreign` FOREIGN KEY (`grocery_catalog_item_id`) REFERENCES `grocery_catalog_items` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `grocery_items_meal_plan_id_foreign` FOREIGN KEY (`meal_plan_id`) REFERENCES `meal_plans` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `grocery_items_member_id_foreign` FOREIGN KEY (`member_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `meal_plans`
--
ALTER TABLE `meal_plans`
  ADD CONSTRAINT `meal_plans_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `meal_statuses`
--
ALTER TABLE `meal_statuses`
  ADD CONSTRAINT `meal_statuses_meal_plan_id_foreign` FOREIGN KEY (`meal_plan_id`) REFERENCES `meal_plans` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `meal_statuses_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `member_payments`
--
ALTER TABLE `member_payments`
  ADD CONSTRAINT `member_payments_grocery_item_id_foreign` FOREIGN KEY (`grocery_item_id`) REFERENCES `grocery_items` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `member_payments_recorded_by_foreign` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `member_payments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
