(() => {
  const host = window.location.hostname;
  const local = window.location.protocol === "file:" || host === "localhost" || host === "127.0.0.1";
  window.BusinessGrowthAPI = {
    core: `${local ? "http://127.0.0.1:4000" : ""}/api`,
    zen: `${local ? "http://127.0.0.1:5000" : ""}${local ? "/api" : "/api/zen"}`,
  };
})();
