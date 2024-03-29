const puppeteer = require("puppeteer");
const client = require(".././client/index.js");
const { promisify } = require("util");
const setAsync = promisify(client.set).bind(client);

module.exports = (async () => {
  async function getJob(url) {
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(url);

    const jobs = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll("#mosaic-provider-jobcards > ul > li")
      ).map((jobs) => ({
        title: jobs.querySelector(".jobTitle").innerText,
        applyLink: jobs.href,
        logo: null,
        postedAt: jobs.querySelector(".date").innerText,
        location: jobs.querySelector(".companyLocation").innerText,
        company: jobs.querySelector(".companyName").innerText,
      }))
    );

    // Skal man afslutte recursion
    if (jobs.length < 1) {
      return jobs;
    } else {
      const nextPageNumber = parseInt(url.match(/start=(\d+)$/)[1], 10) + 10;
      if (nextPageNumber == 100) {
        return jobs;
      }
      const nextUrl = `https://dk.indeed.com/jobs?q=Developer&fromage=15&radius=25&start=${nextPageNumber}`;
      return jobs.concat(await getJob(nextUrl));
    }
  }
  const browser = await puppeteer.launch({ headless: false });
  const firstUrl =
    "https://dk.indeed.com/jobs?q=Developer&fromage=15&radius=25&start=10";
  const jobListe = await getJob(firstUrl);
  const success = setAsync("indeed", JSON.stringify(jobListe));
  console.log("jobListe", jobListe);

  console.log({ success });

  await browser.close();
})();
