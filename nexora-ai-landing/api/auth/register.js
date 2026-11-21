import handler from "../core-handler.js";

export default function register(request, response) {
  request.url = "/api/core-handler?path=auth%2Fregister";
  return handler(request, response);
}
