//@ts-nocheck
"use server";

import { sql } from "kysely";
import { DEFAULT_PAGE_SIZE } from "../../constant";
import { db } from "../../db";
import { InsertProducts, UpdateProducts } from "@/types";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/utils/authOptions";
import { cache } from "react";

// export async function getProducts(pageNo = 1, pageSize = DEFAULT_PAGE_SIZE) {
//   try {
//     let products;
//     let dbQuery = db.selectFrom("products").selectAll();

//     const { count } = await db
//     .selectFrom(
//       sql`(SELECT id FROM products GROUP BY id) AS distinct_products`
//     )
//     .select(sql`COUNT(id) AS count`)
//       .executeTakeFirst();

//     const lastPage = Math.ceil(count / pageSize);

//     products = await dbQuery
//       .distinct()
//       .offset((pageNo - 1) * pageSize)
//       .limit(pageSize)
//       .execute();

//     const numOfResultsOnCurPage = products.length;

//     return { products, count, lastPage, numOfResultsOnCurPage };
//   } catch (error) {
//     throw error;
//   }
// }


//@ts-nocheck


export async function addSingleProduct(product: Omit<InsertProducts, 'id' | 'created_at' | 'updated_at'>) {  
  const { name, description, old_price, discount, rating, colors, brands, gender, occasion, image_url, price } = product;
  console.log("Product details:", {
    name,
    description,
    old_price,
    discount,
    rating,
    colors,
    brands,
    gender,
    occasion,
    image_url,
    price
  });

  try {
     await db.insertInto("products")
      .values(
        {
          name,
          description,
          old_price,
          discount,
          rating,
          colors,
          brands,
          gender,
          occasion,
          image_url,
          price,
        }
      )
      .execute();
    
    return {success:true , message:"product added !!!!"};
  } catch (error) {
    throw new Error(`Failed to add product: ${error.message}`);
  }
  
}

export async function updateProduct(id : number, product :UpdateProducts  ){
  
    const { name, description, old_price, discount, rating, colors, brands, gender, occasion, image_url, price } = product;
    const brandsJson = JSON.stringify(product.brands);
    console.log('Updating product with values:', {
      name: product.name,
      description: product.description,
      old_price: product.old_price,
      discount: product.discount,
      rating: product.rating,
      colors: product.colors,
      brands : brandsJson,
      gender: product.gender,
      occasion: product.occasion,
      image_url: product.image_url
    });
    try {
      await db.updateTable("products")
      .set({
        name,
        description,
        old_price,
        discount,
        rating,
        colors,
        brands : brandsJson,
        gender,
        occasion,
        image_url,
        price,
      })
      .where("id", "=", id)
      .execute();
      return { success: true, message: "Product updated successfully!" };
    
  } catch (error) {
    throw new Error(`Failed to update product: ${error.message}`);
  }
}

export async function getProducts(
  pageNo = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  filters: {
    categoryId?: string[];
    brandId?: string[];
    priceRangeTo?: number;
    gender?: string;
    occasions?: string[];
    discount?: string;
  } = {},
  sortBy : string
) {
  // console.log(sortBy);
  
  try {
    let dbQuery = db.selectFrom("products").selectAll();
    const filterConditions = [];

    if (filters.categoryId && filters.categoryId.length > 0) {
      const categoryFilterConditions = filters.categoryId.map(id => {
        return sql`EXISTS (
          SELECT 1
          FROM product_categories
          WHERE product_categories.product_id = products.id
          AND product_categories.category_id = ${sql.val(id)}
        )`;
      });
      if (categoryFilterConditions.length > 0) {
        filterConditions.push(
          sql`${sql.join(categoryFilterConditions, sql` AND `)}`
        );
      }    
      
    }
    if (filters.brandId && filters.brandId.length > 0) {
      const brandNamesMap = await MapBrandIdsToName(filters.brandId);
      const brandNames = Array.from(brandNamesMap.values());
      const brandNamesString = brandNames.map(name => `'${name}'`).join(', ');
      // console.log(brandNamesString);
      filters.brandId.forEach((id) => {
        filterConditions.push(
          sql`FIND_IN_SET(${sql.val(id)}, REPLACE(REPLACE(brands, '[', ''), ']', ''))`
        );
      });
      
    }
    if (filters.priceRangeTo !== undefined) {
      filterConditions.push(
        sql`price <= ${sql.val(filters.priceRangeTo)}`
      );
    }

    if (filters.gender) {
      filterConditions.push(
        sql`gender = ${sql.val(filters.gender)}`
      );
    }
    
    if (filters.occasions && filters.occasions.length > 0) {
      const occasionsConditions = filters.occasions.map(occasion =>
        sql`FIND_IN_SET(${sql.val(occasion)}, products.occasion) > 0`
      );
      filterConditions.push(
        sql`${sql.join(occasionsConditions, sql` OR `)}`
      );
    }

    if (filters.discount) {
      const [from, to] = filters.discount.split("-");
      filterConditions.push(
        sql`discount BETWEEN ${+from} AND ${+to}`
      );
    }

    if (filterConditions.length > 0) {
      console.log("--------",filterConditions);
      
      dbQuery =  dbQuery.where(sql`${sql.join(filterConditions, sql` AND `)}`)
      // console.log('dbquerylosccscsgggg=====>', filterproducts);

    }
    if (sortBy) {
    
      const [column, direction] = sortBy.split('-');
      if (column && direction) {
        // console.log("Ordering by:", column, direction.toUpperCase());
        const directionUppercase = direction.toUpperCase() as 'ASC' | 'DESC';
        dbQuery = dbQuery.orderBy(sql`${sql.raw(column)} ${sql.raw(directionUppercase)}`);
      } else {
        console.error("Invalid sortBy value:", sortBy);
      }
    }
 
    // Get the total count
    const { count } = await db
      .selectFrom(sql`(SELECT id FROM products GROUP BY id) AS distinct_products`)
      .select(sql`COUNT(id) AS count`)
      .executeTakeFirst();

    // Calculate lastPage
    const lastPage = Math.ceil(count / pageSize);

    // Fetch filtered products
    const products = await dbQuery
      .distinct()
      .offset((pageNo - 1) * pageSize)
      .limit(pageSize)
      .execute();
      // console.log(products);
      
    const numOfResultsOnCurPage = products.length;

    return { products, count, lastPage, numOfResultsOnCurPage };
  } catch (error) {
    throw error;
  }
}

// export async function getProducts(pageNo = 1, pageSize = DEFAULT_PAGE_SIZE) {
//   try {
//     let products;
//     let dbQuery = db.selectFrom("products").selectAll();

//     const { count } = await db
//     .selectFrom(
//       sql`(SELECT id FROM products GROUP BY id) AS distinct_products`
//     )
//     .select(sql`COUNT(id) AS count`)
//       .executeTakeFirst();

//     const lastPage = Math.ceil(count / pageSize);

//     products = await dbQuery
//       .distinct()
//       .offset((pageNo - 1) * pageSize)
//       .limit(pageSize)
//       .execute();

//     const numOfResultsOnCurPage = products.length;

//     return { products, count, lastPage, numOfResultsOnCurPage };
//   } catch (error) {
//     throw error;
//   }
// }

export const getProduct = cache(async function getProduct(productId: number) {
  // console.log("run");
  try {
    const product = await db
      .selectFrom("products")
      .selectAll()
      .where("id", "=", productId)
      .execute();

    return product;
  } catch (error) {
    return { error: "Could not find the product" };
  }
});

async function enableForeignKeyChecks() {
  await sql`SET foreign_key_checks = 1`.execute(db);
}

async function disableForeignKeyChecks() {
  await sql`SET foreign_key_checks = 0`.execute(db);
}

export async function deleteProduct(productId: number) {
  try {
    await disableForeignKeyChecks();
    await db
      .deleteFrom("product_categories")
      .where("product_categories.product_id", "=", productId)
      .execute();
    await db
      .deleteFrom("reviews")
      .where("reviews.product_id", "=", productId)
      .execute();

    await db
      .deleteFrom("comments")
      .where("comments.product_id", "=", productId)
      .execute();

    await db.deleteFrom("products").where("id", "=", productId).execute();

    await enableForeignKeyChecks();
    revalidatePath("/products");
    return { message: "success" };
  } catch (error) {
    return { error: "Something went wrong, Cannot delete the product" };
  }
}

export async function MapBrandIdsToName(brandsId) {
  const brandsMap = new Map();
  try {
    for (let i = 0; i < brandsId.length; i++) {
      const brandId = brandsId.at(i);
      const brand = await db
        .selectFrom("brands")
        .select("name")
        .where("id", "=", +brandId)
        .executeTakeFirst();
      brandsMap.set(brandId, brand?.name);
    }
    return brandsMap;
  } catch (error) {
    throw error;
  }
}

export async function getAllProductCategories(products: any) {
  try {
    const productsId = products.map((product) => product.id);
    const categoriesMap = new Map();

    for (let i = 0; i < productsId.length; i++) {
      const productId = productsId.at(i);
      const categories = await db
        .selectFrom("product_categories")
        .innerJoin(
          "categories",
          "categories.id",
          "product_categories.category_id"
        )
        .select("categories.name")
        .where("product_categories.product_id", "=", productId)
        .execute();
      categoriesMap.set(productId, categories);
    }
    return categoriesMap;
  } catch (error) {
    throw error;
  }
}

export async function getProductCategories(productId: number) {
  try {
    const categories = await db
      .selectFrom("product_categories")
      .innerJoin(
        "categories",
        "categories.id",
        "product_categories.category_id"
      )
      .select(["categories.id", "categories.name"])
      .where("product_categories.product_id", "=", productId)
      .execute();

    return categories;
  } catch (error) {
    throw error;
  }
}
