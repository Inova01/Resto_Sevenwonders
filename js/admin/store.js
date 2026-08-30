/* =========================================================
   SEVEN WONDERS — js/admin/store.js
   ---------------------------------------------------------
   Where the dashboard's changes go.

   Three pieces:

     Draft      the working copy, always in this browser's
                localStorage. Saved on every keystroke so a
                closed tab never loses an afternoon's work.

     Serializer turns a content object back into the text of a
                content/*.js file, byte for byte the same way
                every time.

     Publishers push those files somewhere real. All three
                expose the same four methods, so the dashboard
                does not care which one is selected:

                  id / label / help
                  isConfigured()  → boolean
                  verify()        → Promise<{ok, message}>
                  publish(files, message) → Promise<{ok, message, url}>

                • GitHubPublisher   commits to the repo, which
                  triggers the existing Pages deploy. This is
                  the one to use.
                • DownloadPublisher hands you the files to drop
                  in yourself. No account, no token, works
                  offline — the fallback that always works.
                • SupabasePublisher the upgrade path to a real
                  database. See the note on it before using.
   ========================================================= */
(function () {
  "use strict";

  var SECTIONS = ["settings", "menu", "shop", "gallery", "blog", "home", "about"];

  var DRAFT_KEY = "sw_admin_draft_v1";
  var GH_KEY = "sw_admin_github_v1";
  var SB_KEY = "sw_admin_supabase_v1";
  var META_KEY = "sw_admin_meta_v1";

  /* =====================================================
     Small utilities
     ===================================================== */
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function sameJson(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  function readLS(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function writeLS(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }

  /* base64 of a UTF-8 string, without btoa's Latin-1 limitation —
     the menu contains "Patte Kòde" and "Pate Fête". */
  function utf8ToBase64(str) {
    var bytes = new TextEncoder().encode(str);
    var chunk = 0x8000, out = "";
    for (var i = 0; i < bytes.length; i += chunk) {
      out += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(out);
  }

  /* =====================================================
     DRAFT — the working copy in this browser
     ===================================================== */
  var Draft = {
    key: DRAFT_KEY,

    read: function () { return readLS(DRAFT_KEY, null); },

    write: function (data) {
      var ok = writeLS(DRAFT_KEY, data);
      if (!ok) {
        // localStorage full or blocked (private browsing). The manager
        // must know their work is not being kept.
        console.error("[dashboard] Could not save the draft to this browser.");
      }
      return ok;
    },

    clear: function () {
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
    },

    /* Which sections differ from what is published on the site */
    changedSections: function (draft, published) {
      if (!draft) return [];
      return SECTIONS.filter(function (name) {
        return draft[name] && !sameJson(draft[name], published[name]);
      });
    }
  };

  var Meta = {
    read: function () { return readLS(META_KEY, {}); },
    set: function (patch) {
      var m = Meta.read();
      Object.keys(patch).forEach(function (k) { m[k] = patch[k]; });
      writeLS(META_KEY, m);
      return m;
    }
  };

  /* =====================================================
     SERIALIZER — content object → content/<name>.js text
     ===================================================== */
  var Serializer = {
    path: function (section) { return "content/" + section + ".js"; },

    render: function (section, data) {
      var header =
        "/* =========================================================\n" +
        "   SEVEN WONDERS — content/" + section + ".js\n" +
        "   ---------------------------------------------------------\n" +
        "   Managed from admin.html. Anything you change here by hand\n" +
        "   will be overwritten the next time someone presses Publish\n" +
        "   in the dashboard.\n" +
        "\n" +
        "   Field reference: ADMIN.md\n" +
        "   ========================================================= */\n";

      return header +
        "window.SW_CONTENT = window.SW_CONTENT || {};\n\n" +
        "window.SW_CONTENT." + section + " = " +
        JSON.stringify(data, null, 2) + ";\n";
    },

    /* Every changed section as { path, text } */
    filesFor: function (draft, published) {
      return Draft.changedSections(draft, published).map(function (section) {
        return {
          section: section,
          path: Serializer.path(section),
          text: Serializer.render(section, draft[section])
        };
      });
    }
  };

  /* =====================================================
     PUBLISHER 1 — GitHub
     ---------------------------------------------------------
     Builds ONE commit containing every changed file, using the
     Git data API (blobs → tree → commit → move the branch).

     Why not the simpler "update file contents" endpoint: that
     makes one commit per file, and each commit sets off another
     Pages deploy. Six files would mean six deploys racing each
     other. One commit means one deploy.

     The branch is moved WITHOUT force, so if somebody else
     pushed while the manager was editing, GitHub refuses and we
     say so rather than quietly discarding their work.
     ===================================================== */
  function GitHubPublisher() {
    var API = "https://api.github.com";

    function cfg() {
      return readLS(GH_KEY, { owner: "", repo: "", branch: "main", token: "" });
    }

    function req(path, options) {
      var c = cfg();
      var opts = options || {};
      return fetch(API + path, {
        method: opts.method || "GET",
        headers: {
          Authorization: "Bearer " + c.token,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json"
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined
      }).then(function (res) {
        return res.text().then(function (text) {
          var json = null;
          try { json = text ? JSON.parse(text) : null; } catch (e) {}
          if (!res.ok) {
            var msg = (json && json.message) || res.statusText || ("HTTP " + res.status);
            var err = new Error(msg);
            err.status = res.status;
            err.body = json;
            throw err;
          }
          return json;
        });
      });
    }

    return {
      id: "github",
      label: "GitHub (publishes the live site)",
      help: "Commits the changed files to your repository. GitHub Pages then rebuilds the site, usually within a minute.",

      config: cfg,
      setConfig: function (next) { writeLS(GH_KEY, next); },

      isConfigured: function () {
        var c = cfg();
        return !!(c.owner && c.repo && c.branch && c.token);
      },

      verify: function () {
        var c = cfg();
        if (!this.isConfigured()) {
          return Promise.resolve({ ok: false, message: "Fill in the owner, repository, branch and token first." });
        }
        return req("/repos/" + c.owner + "/" + c.repo).then(function (repo) {
          var perms = repo.permissions || {};
          if (!perms.push) {
            return {
              ok: false,
              message: "Connected to " + repo.full_name + ", but this token cannot write to it. " +
                "The token needs Contents: Read and write."
            };
          }
          return {
            ok: true,
            message: "Connected to " + repo.full_name + " — this token can publish.",
            defaultBranch: repo.default_branch
          };
        }).catch(function (err) {
          var hint = err.status === 401 ? " (the token was rejected — it may have expired)"
            : err.status === 404 ? " (no such repository, or the token cannot see it)"
            : "";
          return { ok: false, message: err.message + hint };
        });
      },

      publish: function (files, message) {
        var c = cfg();
        var base = "/repos/" + c.owner + "/" + c.repo;
        var headSha, treeSha;

        if (!files.length) {
          return Promise.resolve({ ok: true, message: "Nothing to publish — no changes." });
        }

        return req(base + "/git/ref/heads/" + encodeURIComponent(c.branch))
          .then(function (ref) {
            headSha = ref.object.sha;
            return req(base + "/git/commits/" + headSha);
          })
          .then(function (commit) {
            treeSha = commit.tree.sha;
            // Upload each file's content as a blob
            return Promise.all(files.map(function (f) {
              return req(base + "/git/blobs", {
                method: "POST",
                body: { content: utf8ToBase64(f.text), encoding: "base64" }
              }).then(function (blob) {
                return { path: f.path, mode: "100644", type: "blob", sha: blob.sha };
              });
            }));
          })
          .then(function (entries) {
            return req(base + "/git/trees", {
              method: "POST",
              body: { base_tree: treeSha, tree: entries }
            });
          })
          .then(function (tree) {
            return req(base + "/git/commits", {
              method: "POST",
              body: { message: message, tree: tree.sha, parents: [headSha] }
            });
          })
          .then(function (commit) {
            // force:false — refuse to overwrite someone else's push
            return req(base + "/git/refs/heads/" + encodeURIComponent(c.branch), {
              method: "PATCH",
              body: { sha: commit.sha, force: false }
            }).then(function () { return commit; });
          })
          .then(function (commit) {
            return {
              ok: true,
              message: "Published " + files.length + (files.length === 1 ? " file" : " files") +
                ". GitHub Pages is rebuilding the site now — give it about a minute.",
              url: "https://github.com/" + c.owner + "/" + c.repo + "/commit/" + commit.sha
            };
          })
          .catch(function (err) {
            if (err.status === 422 || /not a fast forward/i.test(err.message || "")) {
              return {
                ok: false,
                message: "Somebody else changed the site while you were editing. " +
                  "Nothing was published. Reload this page to pick up their changes, then publish again."
              };
            }
            return { ok: false, message: "Could not publish: " + err.message };
          });
      }
    };
  }

  /* =====================================================
     PUBLISHER 2 — Download the files
     ---------------------------------------------------------
     A browser cannot write into the project folder, so this
     hands over the finished files instead. Always available, no
     account, no token — the fallback when GitHub is not set up
     or the token has expired.
     ===================================================== */
  function DownloadPublisher() {
    return {
      id: "download",
      label: "Download the files (no account needed)",
      help: "Saves the changed content files to your Downloads folder. Copy them into the site's content/ folder and upload as usual.",

      isConfigured: function () { return true; },

      verify: function () {
        return Promise.resolve({ ok: true, message: "Ready — this always works." });
      },

      publish: function (files) {
        if (!files.length) {
          return Promise.resolve({ ok: true, message: "Nothing to publish — no changes." });
        }
        files.forEach(function (f, i) {
          // Stagger slightly: some browsers drop simultaneous downloads
          setTimeout(function () {
            var blob = new Blob([f.text], { type: "text/javascript;charset=utf-8" });
            var url = URL.createObjectURL(blob);
            var a = document.createElement("a");
            a.href = url;
            a.download = f.path.split("/").pop();
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
          }, i * 350);
        });
        return Promise.resolve({
          ok: true,
          message: "Downloading " + files.length + (files.length === 1 ? " file" : " files") +
            ". Put them in the site's content/ folder, replacing the old ones."
        });
      }
    };
  }

  /* =====================================================
     PUBLISHER 3 — Supabase
     ---------------------------------------------------------
     The upgrade path: content in a database instead of in files,
     so a change is live immediately with no rebuild, and you can
     add a reservations/orders inbox later.

     NOT WIRED UP YET, ON PURPOSE. Two things are needed first:

       1. A table, created once in the Supabase SQL editor:

            create table site_content (
              section text primary key,
              data jsonb not null,
              updated_at timestamptz default now()
            );
            alter table site_content enable row level security;
            -- public read:
            create policy "read" on site_content
              for select using (true);
            -- writes: signed-in users only. Do NOT allow anon writes,
            -- or anyone could rewrite the menu.
            create policy "write" on site_content
              for all to authenticated using (true) with check (true);

       2. The site itself must read from Supabase instead of the
          content/*.js files — a change to js/content.js, not to
          this file. Until that is done, publishing here would
          save to the database and the website would carry on
          showing the files, which is worse than not offering it.

     So: it verifies the connection and the table, and refuses to
     publish. That is deliberate, not unfinished.
     ===================================================== */
  function SupabasePublisher() {
    function cfg() { return readLS(SB_KEY, { url: "", anonKey: "", table: "site_content" }); }

    return {
      id: "supabase",
      label: "Supabase (not switched on yet)",
      help: "Connection test only. The website still reads the content files, so publishing here would not change what visitors see. See ADMIN.md before enabling.",

      config: cfg,
      setConfig: function (next) { writeLS(SB_KEY, next); },

      isConfigured: function () {
        var c = cfg();
        return !!(c.url && c.anonKey && c.table);
      },

      verify: function () {
        var c = cfg();
        if (!this.isConfigured()) {
          return Promise.resolve({ ok: false, message: "Fill in the project URL, the anon key and the table name." });
        }
        var url = c.url.replace(/\/+$/, "") + "/rest/v1/" + encodeURIComponent(c.table) + "?select=section&limit=1";
        return fetch(url, { headers: { apikey: c.anonKey, Authorization: "Bearer " + c.anonKey } })
          .then(function (res) {
            if (res.ok) {
              return { ok: true, message: "Reached the project and found the table. Publishing is still switched off — see ADMIN.md." };
            }
            if (res.status === 404) return { ok: false, message: "Project reached, but there is no table called \"" + c.table + "\"." };
            if (res.status === 401) return { ok: false, message: "The anon key was rejected." };
            return { ok: false, message: "Supabase replied " + res.status + " " + res.statusText + "." };
          })
          .catch(function (err) {
            return { ok: false, message: "Could not reach Supabase: " + err.message };
          });
      },

      publish: function () {
        return Promise.resolve({
          ok: false,
          message: "Supabase publishing is switched off on purpose: the website still reads the content files, " +
            "so saving to the database would not change what visitors see. Use GitHub to publish."
        });
      }
    };
  }

  /* =====================================================
     Export
     ===================================================== */
  var publishers = [GitHubPublisher(), DownloadPublisher(), SupabasePublisher()];

  window.SWStore = {
    SECTIONS: SECTIONS,
    Draft: Draft,
    Meta: Meta,
    Serializer: Serializer,
    publishers: publishers,
    get: function (id) {
      return publishers.filter(function (p) { return p.id === id; })[0] || publishers[0];
    },
    clone: clone,
    sameJson: sameJson
  };
})();
