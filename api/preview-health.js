/* ==========================================================
   UNFILTEREDLOG
   SERVERLESS HEALTH CHECK
   ========================================================== */


export default function handler(
  request,
  response
) {
  response
    .status(
      200
    )
    .json({
      ok:
        true,

      product:
        "UNFILTEREDLOG",

      function:
        "preview-health",

      time:
        new Date()
          .toISOString(),
    });
}
