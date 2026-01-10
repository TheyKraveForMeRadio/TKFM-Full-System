/* TKFM Paid Lane Submit helper
   Provides: window.tkfmPaidLaneSubmit(payload)
   Posts to: /.netlify/functions/paid-lane-submit
*/
(function(){
  window.tkfmPaidLaneSubmit = async function(payload){
    const body = {
      lane: payload.lane || "",
      title: payload.title || "",
      link: payload.link || "",
      contact: payload.contact || "",
      notes: payload.notes || "",
      page: location.pathname,
      href: location.href
    };
    const res = await fetch("/.netlify/functions/paid-lane-submit", {
      method: "POST",
      headers: { "content-type":"application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(()=>({}));
    if (!res.ok) throw new Error(data.error || "submit_failed");
    return data;
  };
})();
