import { useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';

/**
 * Custom hook providing memoized toast notification methods (CQ-06)
 */
const useToast = () => {
  const success = useCallback((message) => {
    toast.success(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }, []);

  const error = useCallback((message) => {
    toast.error(message, {
      position: 'top-right',
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }, []);

  const warning = useCallback((message) => {
    toast.warning(message, {
      position: 'top-right',
      autoClose: 3500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }, []);

  const info = useCallback((message) => {
    toast.info(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }, []);

  return useMemo(() => ({ success, error, warning, info }), [success, error, warning, info]);
};

export default useToast;
