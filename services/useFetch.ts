import { useEffect, useState } from "react";

const useFetch = <T>(
  fetchFunction: () => Promise<T>,
  enabled: boolean = true // ✅ Otomatik fetch'i kontrol eden parametre
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async (): Promise<T | null> => {
    if (!enabled) return null; // ✅ enabled false ise hiç fetch yapma

    try {
      setLoading(true);
      setError(null);

      const result = await fetchFunction();
      setData(result);
      return result;
    } catch (err) {
      const typedError = err instanceof Error ? err : new Error("An unknown error occurred");
      setError(typedError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled]);

  return { data, loading, error, refetch: fetchData, reset };
};

export default useFetch;
