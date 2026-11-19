"""未ログインの Gemini HTML で serviceLoginLink が成立するかを検査する。

ログイン済みの Orca タブでは serviceLoginLink は出ないため、Cookie 無しで取得した
HTML を使って「div.boqOnegoogleliteOgbOneGoogleBar の配下に
a[href^="https://accounts.google.com/ServiceLogin"] があるか」を確認する。
(CSS 内に同じクラス名の文字列が出てくるので、grep ではなく要素の入れ子で判定する)

使い方:
  curl -sL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36" \
    https://gemini.google.com/app -o "$TMPDIR/gemini-anon.html"
  python3 -I .claude/skills/gemini-selector-repair/scripts/check-login-link.py "$TMPDIR/gemini-anon.html"

selectors.json の serviceLoginLink を変えた場合は、下の BAR_CLASS / HREF_PREFIX も合わせる。
出力: ログインリンクごとに、OneGoogleBar 配下なら True。[True] なら成立。
"""

import sys
from html.parser import HTMLParser

BAR_CLASS = "boqOnegoogleliteOgbOneGoogleBar"
HREF_PREFIX = "https://accounts.google.com/ServiceLogin"
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}


class LoginLinkFinder(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.hits = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a" and (attrs.get("href") or "").startswith(HREF_PREFIX):
            inside = any(t == "div" and BAR_CLASS in (c or "").split() for t, c in self.stack)
            self.hits.append(inside)
        if tag not in VOID:
            self.stack.append((tag, attrs.get("class")))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break


def main():
    if len(sys.argv) != 2:
        sys.exit("usage: check-login-link.py <gemini-anon.html>")
    finder = LoginLinkFinder()
    with open(sys.argv[1], encoding="utf-8") as f:
        finder.feed(f.read())
    print(finder.hits)
    if not any(finder.hits):
        sys.exit("serviceLoginLink: NOT FOUND (ログインリンクが無いか、OneGoogleBar の外に移った)")


if __name__ == "__main__":
    main()
