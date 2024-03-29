const puppeteer = require("puppeteer");
const client = require("../../client/index.js");
const { promisify } = require("util");
const setAsync = promisify(client.set).bind(client);

module.exports = (async () => {
  async function getJob(url) {
    const page = await browser.newPage();
    await page.goto(url);

    /*
    const button = await page.$('.close')
    await button.evaluate(button => button.click());
    */

    let jobs = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".PaidJob")).map((jobs) => {
        return {
          company: jobs.querySelector("p > a").innerText,
          logo: jobs.querySelector("a > img")
            ? jobs.querySelector("a > img").src
            : null,
          description: jobs.querySelector(".PaidJob-inner").innerText,
          location: jobs
            .querySelector(" p")
            .innerText.split(",")
            .splice(1, 1)
            .toString(),
          title: jobs.querySelector("a > b").innerText,
          postedAt: jobs.querySelector(
            ".jix_toolbar > div:nth-child(1) > div:nth-child(2) > time:nth-child(1)"
          ).innerText,
          applyLink: jobs.querySelector(".jix_toolbar .btn-primary").href,
        };
      })
    );
    // Skal man afslutte recursion
    if (jobs.length < 1) {
      return jobs;
    } else {
      const nextPageNumber = parseInt(url.match(/page=(\d+)$/)[1], 10) + 1;
      if (nextPageNumber == 28) {
        return jobs;
      }
      const nextUrl = `https://www.jobindex.dk/jobsoegning/it/systemudvikling?page=${nextPageNumber}`;
      return jobs.concat(await getJob(nextUrl));
    }
  }
  const browser = await puppeteer.launch({ headless: false });
  const firstUrl =
    "https://www.jobindex.dk/jobsoegning/it/systemudvikling?page=1";
  const jobListe = await getJob(firstUrl);
  console.log("jobliste: ", jobListe);
  const success = setAsync("jobindex", JSON.stringify(jobListe));
  console.log({ success });

  await browser.close();
})();
