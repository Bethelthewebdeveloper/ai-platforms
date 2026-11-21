import handler from "../core-handler.js";

export default function login(request, response) {
  request.url = "/api/core-handler?path=auth%2Flogin";
  return handler(request, response);
}
