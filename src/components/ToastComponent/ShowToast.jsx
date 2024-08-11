import { toast } from 'react-toastify';
import { Bounce } from 'react-toastify';

const showToast = (message, type = 'default') => {
  const options = {
    position: "top-right",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
    transition: Bounce,
  };

  switch (type) {
    case 'success':
      toast.success(message, options);
      break;
    case 'error':
      toast.error(message, options);
      break;
    case 'info':
      toast.info(message, options);
      break;
    case 'warn':
      toast.warn(message, options);
      break;
    default:
      toast(message, options);
      break;
  }
};

export default showToast;
