
// "use client";
import { useRouter } from 'next/router';
import { getProducts , getAllProductCategories } from "@/actions/productActions";
import { DEFAULT_PAGE_SIZE } from "../../../constant";
import PaginationSection from "@/components/PaginationSection";
import SortBy from "@/components/SortBy";
import Filter from "@/components/Filter";
import ProductTable from "@/components/ProductTable";
import { Suspense, useEffect } from "react";
import { getCategories } from "@/actions/categoryActions";
import { getBrands } from "@/actions/brandActions";
// import { Console } from 'console';
// import SortBy from '@/components/SortBy';
// import { useQueryParams } from "@/hooks/useQueryParams";
// import { useState } from 'react';

export default async function Products({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = searchParams as any;
  
  const getArrayFromParam = (param: string | string[] | undefined): string[] => {
    if (!param) return [];
    return typeof param === 'string' ? param.split(',') : param;
  };
  // console.log(getArrayFromParam);
  const categoryId = getArrayFromParam(searchParams?.categoryId);
  const brandId = getArrayFromParam(searchParams?.brandId);
  
  // const brandIds = searchParams.brandId
  // console.log(categoryId)
  const priceRangeTo = searchParams?.priceRangeTo ? parseFloat(searchParams.priceRangeTo as string) : undefined;
  const gender = searchParams?.gender as string ?? '';
  // console.log(gender);
  
  const occasions = getArrayFromParam(searchParams?.occasions);
  const discount = searchParams?.discount as string ?? '';
  // const [priceRangeTo, setPriceRangeTo] = useState<number | undefined>(undefined);
  // console.log(query);
  // const sortby = searchParams?.sortby;

  const sortBy = searchParams?.sortBy as string || '';


  const { products, lastPage, numOfResultsOnCurPage } = await getProducts(
    +page,
    +pageSize,
    {brandId , categoryId,priceRangeTo,gender,occasions,discount},
    sortBy
  );
  const brands = await getBrands();
  const categories = await getCategories();
  const productcaategories = await getAllProductCategories(products)
// console.log(productcaategories);

  return (
    <div className="pb-20 pt-8">
      <h1 className="text-4xl mb-8">Product List</h1>
      <div className="mb-8">
        <SortBy />
        <div className="mt-4">
          <Filter categories={categories} brands={brands} />
        </div>
      </div>

      <h1 className="text-lg font-bold mb-4">Products</h1>
      <Suspense
        fallback={<p className="text-gray-300 text-2xl">Loading Products...</p>}
      >
        <ProductTable
          products={products}
          numOfResultsOnCurPage={numOfResultsOnCurPage}
        />
      </Suspense>
      {products.length > 0 && (
        <PaginationSection
          lastPage={lastPage}
          pageNo={+page}
          pageSize={+pageSize}
        />
      )}
    </div>
  );
}
