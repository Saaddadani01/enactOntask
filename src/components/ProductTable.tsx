import {
  MapBrandIdsToName,
  getAllProductCategories,
} from "@/actions/productActions";
import ProductRow from "./ProductRow";
import Empty from "./Empty";

async function ProductTable({ products, numOfResultsOnCurPage }) {
  if (products.length === 0) {
    return <Empty />;
  }

  const brandsArr = new Set<number>();

  products
  .map(product => (product?.brands as string).split(',').map(id => parseInt(id, 10)))
  .flat()          // Flatten the array of arrays into a single array
  .filter(id => !isNaN(id))  // Remove any NaN values
  .forEach(brandId => brandsArr.add(brandId)); // Add each brand ID to the Set

// Convert Set to Array if needed
const uniqueBrandIds = Array.from(brandsArr);

  const brandsId = [...brandsArr];
  const brandsMap = await MapBrandIdsToName(brandsId);
  const productCategories = await getAllProductCategories(products);

  return (
    <table>
      <thead>
        <tr>
          <th>Product Id</th>
          <th>Image</th>
          <th>Name</th>
          <th>Description</th>
          <th>Price</th>
          <th>Colors</th>
          <th>Rating</th>
          <th>Gender</th>
          <th>Categories</th>
          <th>Brands</th>
          <th>Occasion</th>
          <th>Operations</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => {
          return (
            <ProductRow
              key={product.id}
              product={product}
              productCategories={productCategories.get(product.id)}
              brandsMap={brandsMap}
              numOfResultsOnCurPage={numOfResultsOnCurPage}
            />
          );
        })}
      </tbody>
    </table>
  );
}

export default ProductTable;
