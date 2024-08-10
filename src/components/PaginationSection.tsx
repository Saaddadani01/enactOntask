"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect ,useState} from "react";

function PaginationSection({
  lastPage,
  pageNo,
  pageSize,
}: {
  lastPage: number;
  pageNo: number;
  pageSize: number;
}) {
  const router = useRouter();

  const query = useSearchParams();
  const searchParams = new URLSearchParams(query);

  const [currentPage, setCurrentPage] = useState(pageNo);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);


  useEffect(() => {
    setCurrentPage(pageNo);
  }, [pageNo]);

  useEffect(() => {
    setCurrentPageSize(pageSize);
  }, [pageSize]);
  function handlePrev() {
    const newPage = currentPage - 1;
    updateUrl(newPage,currentPageSize)
  }

  function handleNext() {
    const newPage = currentPage + 1;
    // setCurrentPage(newPage);
    updateUrl(newPage,currentPageSize)
    console.log(pageNo);
  }
  function changePageSize(e) {
    const newPageSize = parseInt(e.target.value);
    updateUrl(currentPage, newPageSize);
  }
  

  function updateUrl(page: number, size: number) {
    const params = new URLSearchParams(query.toString());
    params.set("page", page.toString());
    params.set("pageSize", size.toString());
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="mt-12 p-4 bg-gray-800 flex justify-center gap-4 items-center mb-8">
      <select
        value={currentPageSize}
        name="page-size"
        className="text-black"
        onChange={changePageSize}
      >
        {["10", "25", "100"].map((val) => {
          return (
            <option key={val} value={val}>
              {val}
            </option>
          );
        })}
      </select>
      <button
        className="p-3 bg-slate-300 text-black disabled:cursor-not-allowed"
        disabled={currentPage === 1}
        onClick={handlePrev}
      >
        &larr;Prev
      </button>
      <p>
        Page {currentPage} of {lastPage}{" "}
      </p>
      <button
        className="p-3 bg-slate-300 text-black disabled:cursor-not-allowed"
        disabled={currentPage === lastPage}
        onClick={handleNext}
      >
        Next&rarr;
      </button>
    </div>
  );
}

export default PaginationSection;
