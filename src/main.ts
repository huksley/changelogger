import * as git from "nodegit";
import * as fs from "fs";
import * as winston from "winston";
import * as R from "rambda";

const url = "https://github.com/serverless/serverless"
const dir = "git1iCRpGN"//fs.mkdtempSync("git1")

const oops = R.curry((msg: string, err) => winston.error(msg, err))
const log = function <T>(msg: string, arg: T) { winston.info(msg, arg); return Promise.resolve(arg); }
const f2 = function <A,B>(a: A, b: B) { return Promise.resolve([ a, b ]); }
const p = fs.existsSync(dir) ? git.Repository.openBare(dir) : git.Repository.init(dir, 1);
  p
  .then(r => log(`Created repository in ${dir}`, r))
  .then(r => f2(r, r.getRemotes()))
  .then((r, l) => {
      if (!l.includes("origin")) {
        git.Remote.create(r, "origin", url)
        winston.info("Added fetch origin", url)
        r.fetch("origin", {
          downloadTags: 1
        }).then(_ => {
          winston.info("Fetched remote")
        }).catch(oops("Failed fetch"))
      }

      r.getBranchCommit("refs/tags/v1.39.1").then(a => {
        r.getBranchCommit("refs/tags/v1.40.0").then(b => {
          winston.info(`Tags ${a}, ${b}`)
          r.getTree(a.id()).then(atree => {
            r.getTree(b.id()).then(btree => {
              git.Diff.treeToTree(r, atree, btree).then(diff => {
                winston.info("Got diff", diff)
              }).catch(oops("Failed to get diff"))
            }).catch(oops("Failed to get end tag tree"))
          }).catch(oops("Failed to get end tag tree"))
        }).catch(oops("Failed to get end tag"))
      }).catch(oops("Failed to get start tag"))
    })
  })
  .catch(oops("Failed to open repository"))
