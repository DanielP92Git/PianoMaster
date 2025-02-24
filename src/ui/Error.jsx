function Error({ error }) {
  return (
    <div className="text-red-600 bg-red-50 p-4 rounded-lg text-center">
      {error}
    </div>
  );
}

export default Error;
