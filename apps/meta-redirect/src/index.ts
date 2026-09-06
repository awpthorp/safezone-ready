/** SEO satellite: every request on metasafezone.com 301s to the mothership Meta page. */
export default {
  async fetch(): Promise<Response> {
    return Response.redirect("https://safezoneready.com/meta", 301);
  },
};
