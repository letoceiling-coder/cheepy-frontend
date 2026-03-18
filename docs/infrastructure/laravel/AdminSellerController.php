<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Seller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminSellerController extends Controller
{
    /**
     * GET /api/v1/admin/sellers
     * List sellers with search, pavilion filter, pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $q = Seller::query();

        if ($search = $request->get('search')) {
            $q->where(function ($b) use ($search) {
                $b->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($pavilion = $request->get('pavilion')) {
            $q->where('pavilion', 'like', "%{$pavilion}%");
        }

        $perPage = min((int) $request->get('per_page', 20), 100);
        $sellers = $q->orderBy('name')
            ->paginate($perPage);

        $data = $sellers->map(fn (Seller $s) => [
            'id' => $s->id,
            'slug' => $s->slug,
            'name' => $s->name,
            'avatar' => $s->avatar ?? null,
            'pavilion' => $s->pavilion,
            'source_url' => $s->source_url,
            'products_count' => $s->products_count ?? 0,
            'created_at' => $s->created_at?->toIso8601String(),
        ]);

        return response()->json([
            'data' => $data,
            'meta' => [
                'total' => $sellers->total(),
                'per_page' => $sellers->perPage(),
                'current_page' => $sellers->currentPage(),
                'last_page' => $sellers->lastPage(),
            ],
        ]);
    }

    /**
     * GET /api/v1/admin/sellers/{id}
     * Seller detail with products_count and products_preview.
     */
    public function show(int $id): JsonResponse
    {
        $seller = Seller::find($id);
        if (!$seller) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $productsCount = Product::where('seller_id', $seller->id)->count();
        $productsPreview = Product::where('seller_id', $seller->id)
            ->with('category:id,name,slug')
            ->orderBy('parsed_at', 'desc')
            ->limit(5)
            ->get(['id', 'title', 'price_raw', 'status', 'parsed_at', 'category_id']);

        $data = $seller->toArray();
        $data['products_count'] = $productsCount;
        $data['products_preview'] = $productsPreview;

        return response()->json($data);
    }

    /**
     * GET /api/v1/admin/sellers/{id}/products
     * Seller products with filters, pagination, sorting.
     */
    public function products(Request $request, int $id): JsonResponse
    {
        $seller = Seller::find($id);
        if (!$seller) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $q = Product::where('seller_id', $seller->id)->with('category:id,name,slug');

        if ($search = $request->get('search')) {
            $q->where('title', 'like', "%{$search}%");
        }
        if ($categoryId = $request->get('category_id')) {
            $q->where('category_id', $categoryId);
        }
        if ($status = $request->get('status')) {
            $q->where('status', $status);
        }
        if ($priceFrom = $request->get('price_from')) {
            $q->where('price_raw', '>=', (int) $priceFrom);
        }
        if ($priceTo = $request->get('price_to')) {
            $q->where('price_raw', '<=', (int) $priceTo);
        }

        $sortBy = $request->get('sort_by', 'parsed_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSort = ['parsed_at', 'price_raw', 'title', 'created_at'];
        if (in_array($sortBy, $allowedSort)) {
            $q->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');
        }

        $perPage = min((int) $request->get('per_page', 30), 100);
        $products = $q->paginate($perPage);

        return response()->json([
            'data' => $products->items(),
            'meta' => [
                'total' => $products->total(),
                'per_page' => $products->perPage(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
            ],
            'seller' => $seller->toArray(),
        ]);
    }
}
