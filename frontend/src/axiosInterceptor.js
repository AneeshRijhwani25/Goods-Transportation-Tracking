import axios from "axios";
import { toast } from "react-toastify";

const setupAxiosInterceptors = () => {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(error.response.data, "text/html");
      const preTag = doc.querySelector("pre");
      let errorText = "An error occurred";
      if (preTag) {
        const preContent = preTag.innerHTML;
        const firstBrIndex = preContent.indexOf("<br>");
        if (firstBrIndex !== -1) {
          errorText = preContent.substring(0, firstBrIndex);
        } else {
          errorText = preTag.textContent;
        }
      }
      toast.error(errorText);
    }
  );
};

export default setupAxiosInterceptors;
