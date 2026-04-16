const lzString = require('lz-string');

const value = "{\"FD\":\"ᯡ࡞䰭惆ʐ㎡ᘧ堮戡㠨怭ᲀҌ䁣Ⱐ䰤䦹䐠氠㠤瀬㒚,ǹ䙐ᖠ据朕㶨͑㠡㎑ϡ&汾+䁈䳂㊠數䠡㌑ᣒ㪕医⯷䔄䓜廬í䷀砢〥匵㬰⼒Ⲹ庽恀┇㩒☉⻰穒㵛ǵ毩䀦栢甐Ӥ䥌ᢵ妽歭֒٪ᨈ夎窂㲛嶺ന捃ឺ█є斈ᙤौ⺢捒棩湸⽑ῄ䂽䰻撰㨴ࡣ䍂乒⽦Я区瀵ᩓ岤娧ሑҚ㋲䱸Ⲛഠ˹Ⳁ䂀Ĕ`༊Р瓬ㄵң࠰爠א͖␠ຊ䀢10†䫉湸)瀣ռ6堰ߘ#憮叉ሠཋ⏐娠ᩢ䗄®ݑ᭡⊙䪔ǆ⠠縠ᗹ➥䃬ᨫ啣ᐠ⽖ឨቩ犐ဣ፫㋨㸳笱ࡔ㥼䒻⢘Њ⍡㪹Ⱟګࡩ㸼埩ࡴ-㖑淒簹Ҷ惮㋊槔ࣲ犭Ј曂笴ᨲ玹Ṹ⒯抨ᰤ㻬䂐᩻ҳ壜ᘥ憛峌㒹ḁ䘱ᘮあ⓵二极ヴ㛺ẁ䭕㭪垀ʞ⌬⇛࠳᳤⇈᱙㧵痀條ㆬ䁁ㄙ勳䠑晅洶䜩ㄇ㣸䞋㋣㪕撁ᜠ⾰  \"}";

try {
  const parsed = JSON.parse(value);
  if (parsed.FD) {
    const dec1 = lzString.decompress(parsed.FD);
    const dec2 = lzString.decompressFromUTF16(parsed.FD);
    const dec3 = lzString.decompressFromBase64(parsed.FD);
    const dec4 = lzString.decompressFromEncodedURIComponent(parsed.FD);

    console.log("decompress:", dec1);
    console.log("decompressFromUTF16:", dec2);
  }
} catch(e) {
  console.error(e);
}
