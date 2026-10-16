# Vimrc Outside

Obsidian の vim モードと、[Vimrc Support](https://github.com/esm7/obsidian-vimrc-support) で追加したマッピングは、エディタにフォーカスがあるときしか動きません。このプラグインは、同じノーマルモードのマッピングをエディタの外でも使えるようにします。対象は、空タブ（「ファイルが開かれていません」）、閲覧モード、ファイルエクスプローラーなどのサイドバー、グラフビューなどです。

Vimrc Support と同じ `.obsidian.vimrc` を読むので、マッピングは一か所で管理できます。

## vimrc から読むもの

Obsidian のコマンドを実行するノーマルモードのマッピングだけを読みます。

```vim
exmap kffind obcommand keyfiler:find-files
nmap ,r :kffind<CR>

nmap <C-w>v :obcommand workspace:split-vertical<CR>
```

- `map` / `nmap` / `noremap` / `nnoremap` を読みます。`unmap` / `nunmap` は、それより前のマッピングを消します。
- 次のものは無視します: 普通のキー列へのマッピング（`nmap j gj`）、`surround`、`pasteinto`、`jscommand`、ビジュアルモードと挿入モードのマッピング。
- キー表記: `<C-x>`、`<A-x>`、`<S-x>`、`<Space>`、`<CR>`、`<Esc>`、`<Tab>`、`<lt>`、`<Bslash>` など。
- 長いマッピングの先頭部分と一致するマッピングは、タイムアウトまで次のキーを待ちます（設定の Timeout。vim の `timeoutlen` と同じです）。

## 有効になる場所

テキスト入力にフォーカスがなく、モーダル・メニュー・候補ポップアップのどれも開いていないときに有効です。エディタ内では今まで通り Vimrc Support がキーを処理します。マッピングの先頭にならないキーは、そのまま通します。

Obsidian 自身のホットキーは、このプラグインより先に処理されます。Obsidian のホットキーと同じキーをマッピングに使う場合（たとえば既定ではタブを閉じる `<C-w>`）は、設定 → ホットキー でそのホットキーを外してください。

## コマンドライン（`:`）

エディタの外で `:` を押すと、画面下に vim 風のコマンドラインが開きます（設定でオフにできます）。

- vimrc の `exmap ... obcommand ...` で定義した ex コマンド（`:q`、`:vsplit`、`:kffind` など）と、`:obcommand <コマンドID>` を実行できます。
- `<Tab>` / `<S-Tab>` で補完します。`obcommand ` の後ではコマンド ID を補完します。
- `<Up>` / `<Down>`（`<C-p>` / `<C-n>`）で履歴をたどれます。入力済みの文字で絞り込みます。
- `<Esc>` で閉じます。空のまま `<BS>` を押しても閉じます。
- 開いたときに IME をオフにするシェルコマンドを実行します（設定の IME off command。Linux の既定は `fcitx5-remote -c`）。
- `surround` などエディタが必要なコマンドは実行できません。

## 再読み込み

vimrc が変わっていれば、Obsidian のウィンドウにフォーカスが戻ったときに自動で読み直します。手動で読み直すときは **Reload vimrc** コマンドを使います。設定画面には、読み込んだマッピングの一覧が表示されます。存在しないコマンドを指しているマッピングには警告が付きます。
