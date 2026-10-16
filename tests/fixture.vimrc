set clipboard=unnamed
" set clipboard+=unnamedplus

" window controls
exmap wq obcommand workspace:close
exmap q obcommand workspace:close

exmap focusRight obcommand editor:focus-right
nmap <C-w>l :focusRight<CR>

exmap focusLeft obcommand editor:focus-left
nmap <C-w>h :focusLeft<CR>

exmap focusTop obcommand editor:focus-top
nmap <C-w>k :focusTop<CR>

exmap focusBottom obcommand editor:focus-bottom
nmap <C-w>j :focusBottom<CR>

exmap vsplit obcommand workspace:split-vertical
exmap vs obcommand workspace:split-vertical
nmap <C-w>v :vsplit<CR>

exmap split obcommand workspace:split-horizontal
exmap sp obcommand workspace:split-horizontal
nmap <C-w>s :split<CR>


" カーソル移動
nmap j gj
nmap k gk


" Go back and forward with Ctrl+O and Ctrl+I
" (make sure to remove default Obsidian shortcuts for these to work)
exmap back obcommand app:go-back
nmap <C-o> :back<CR>
exmap forward obcommand app:go-forward
nmap <C-i> :forward<CR>


exmap surround_wiki surround [[ ]]
exmap surround_double_quotes surround " "
exmap surround_single_quotes surround ' '
exmap surround_backticks surround ` `
exmap surround_brackets surround ( )
exmap surround_square_brackets surround [ ]
exmap surround_curly_brackets surround { }

" NOTE: must use 'map' and not 'nmap'
map [[ :surround_wiki<CR>
nunmap S
vunmap S
map S" :surround_double_quotes<CR>
map S' :surround_single_quotes<CR>
map S` :surround_backticks<CR>
map Sb :surround_brackets<CR>
map S( :surround_brackets<CR>
map S) :surround_brackets<CR>
map S[ :surround_square_brackets<CR>
map S] :surround_square_brackets<CR>
map S{ :surround_curly_brackets<CR>
map S} :surround_curly_brackets<CR>

" Maps pasteinto to Alt-p
map <A-p> :pasteinto


" Emulate Folding https://vimhelp.org/fold.txt.html#fold-commands
exmap togglefold obcommand editor:toggle-fold
exmap foldmore obcommand editor:fold-more
exmap foldless obcommand editor:fold-less
exmap encfold obcommand enclosing-fold:fold
exmap encunfold obcommand enclosing-fold:unfold
exmap enctoggle obcommand enclosing-fold:toggle
nmap zo :encunfold<CR>
nmap zc :encfold<CR>
nmap za :enctoggle<CR>
exmap encfoldr obcommand enclosing-fold:fold-recursive
exmap encunfoldr obcommand enclosing-fold:unfold-recursive
exmap foldheadings obcommand enclosing-fold:fold-headings
exmap unfoldheadings obcommand enclosing-fold:unfold-headings
nmap zC :encfoldr<CR>
nmap zO :encunfoldr<CR>
nmap zH :foldheadings<CR>
nmap zh :unfoldheadings<CR>

exmap unfoldall obcommand editor:unfold-all
nmap zR :unfoldall<CR>

exmap foldall obcommand editor:fold-all
nmap zM :foldall<CR>


" Daily notes
exmap dailynotes obcommand daily-notes
nmap g,<Space> :dailynotes<CR>


exmap switcher obcommand switcher:open
"nmap \r :switcher<CR>


exmap tabselector obcommand tab-selector:open-tab-selector
nmap \t :tabselector<CR>


" スペースをリーダーキーに使うので、既定の動作を外しておく
"unmap <Space>

unmap ,

" Keyfiler のコマンドを Ex コマンドとして定義する
exmap kffind obcommand keyfiler:find-files
exmap kfbrowse obcommand keyfiler:file-browser-current-folder
exmap kfroot obcommand keyfiler:file-browser-root
exmap kfgrep obcommand keyfiler:grep

" キーに割り当てる
nmap ,r :kffind<CR>
nmap ,g :kfbrowse<CR>
nmap ,j :kfroot<CR>
nmap \gr :kfgrep<CR>
