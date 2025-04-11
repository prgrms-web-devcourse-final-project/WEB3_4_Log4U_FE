export function getPageNumber() {
  const totalCount = 100;
  const limit = 10;
  return Math.ceil(totalCount / limit);
}

export function Pages() {
  const pages = Array.from({ length: getPageNumber() }).map((_, index) => {
    return (
      <button key={index + 1} className={'mx-2'}>
        {index + 1}
      </button>
    );
  });
  return (
    <div className='flex justify-center'>
      {pages.length > 6
        ? [
            ...pages.slice(0, 3),
            <p key={-1} className={'mx-2'}>
              ...
            </p>,
            ...pages.slice(-2),
          ]
        : pages}
    </div>
  );
}

export function Pagination() {
  return (
    <div className={'flex justify-center font-bold'}>
      <button>← Previous</button>
      <Pages></Pages>
      <button>Next →</button>
    </div>
  );
}
