/**
 * ouMusic Cloud Sync Engine (100% Client-Side Serverless GitHub Database)
 * Supports Personal Access Token login, automatic private repo creation (oumusic-sync),
 * account-data.json smart-merge sync, and cross-device QR code transfer.
 * Strictly zero emojis.
 */

/* Embedded standalone QR generator fallback */
/**
 * Minified by jsDelivr using Terser v5.37.0.
 * Original file: /npm/qrcode-generator@1.4.4/qrcode.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
var qrcode=function(){var t=function(t,r){var e=t,n=g[r],o=null,i=0,a=null,u=[],f={},c=function(t,r){o=function(t){for(var r=new Array(t),e=0;e<t;e+=1){r[e]=new Array(t);for(var n=0;n<t;n+=1)r[e][n]=null}return r}(i=4*e+17),l(0,0),l(i-7,0),l(0,i-7),s(),h(),d(t,r),e>=7&&v(t),null==a&&(a=p(e,n,u)),w(a,r)},l=function(t,r){for(var e=-1;e<=7;e+=1)if(!(t+e<=-1||i<=t+e))for(var n=-1;n<=7;n+=1)r+n<=-1||i<=r+n||(o[t+e][r+n]=0<=e&&e<=6&&(0==n||6==n)||0<=n&&n<=6&&(0==e||6==e)||2<=e&&e<=4&&2<=n&&n<=4)},h=function(){for(var t=8;t<i-8;t+=1)null==o[t][6]&&(o[t][6]=t%2==0);for(var r=8;r<i-8;r+=1)null==o[6][r]&&(o[6][r]=r%2==0)},s=function(){for(var t=B.getPatternPosition(e),r=0;r<t.length;r+=1)for(var n=0;n<t.length;n+=1){var i=t[r],a=t[n];if(null==o[i][a])for(var u=-2;u<=2;u+=1)for(var f=-2;f<=2;f+=1)o[i+u][a+f]=-2==u||2==u||-2==f||2==f||0==u&&0==f}},v=function(t){for(var r=B.getBCHTypeNumber(e),n=0;n<18;n+=1){var a=!t&&1==(r>>n&1);o[Math.floor(n/3)][n%3+i-8-3]=a}for(n=0;n<18;n+=1){a=!t&&1==(r>>n&1);o[n%3+i-8-3][Math.floor(n/3)]=a}},d=function(t,r){for(var e=n<<3|r,a=B.getBCHTypeInfo(e),u=0;u<15;u+=1){var f=!t&&1==(a>>u&1);u<6?o[u][8]=f:u<8?o[u+1][8]=f:o[i-15+u][8]=f}for(u=0;u<15;u+=1){f=!t&&1==(a>>u&1);u<8?o[8][i-u-1]=f:u<9?o[8][15-u-1+1]=f:o[8][15-u-1]=f}o[i-8][8]=!t},w=function(t,r){for(var e=-1,n=i-1,a=7,u=0,f=B.getMaskFunction(r),c=i-1;c>0;c-=2)for(6==c&&(c-=1);;){for(var g=0;g<2;g+=1)if(null==o[n][c-g]){var l=!1;u<t.length&&(l=1==(t[u]>>>a&1)),f(n,c-g)&&(l=!l),o[n][c-g]=l,-1==(a-=1)&&(u+=1,a=7)}if((n+=e)<0||i<=n){n-=e,e=-e;break}}},p=function(t,r,e){for(var n=A.getRSBlocks(t,r),o=b(),i=0;i<e.length;i+=1){var a=e[i];o.put(a.getMode(),4),o.put(a.getLength(),B.getLengthInBits(a.getMode(),t)),a.write(o)}var u=0;for(i=0;i<n.length;i+=1)u+=n[i].dataCount;if(o.getLengthInBits()>8*u)throw"code length overflow. ("+o.getLengthInBits()+">"+8*u+")";for(o.getLengthInBits()+4<=8*u&&o.put(0,4);o.getLengthInBits()%8!=0;)o.putBit(!1);for(;!(o.getLengthInBits()>=8*u||(o.put(236,8),o.getLengthInBits()>=8*u));)o.put(17,8);return function(t,r){for(var e=0,n=0,o=0,i=new Array(r.length),a=new Array(r.length),u=0;u<r.length;u+=1){var f=r[u].dataCount,c=r[u].totalCount-f;n=Math.max(n,f),o=Math.max(o,c),i[u]=new Array(f);for(var g=0;g<i[u].length;g+=1)i[u][g]=255&t.getBuffer()[g+e];e+=f;var l=B.getErrorCorrectPolynomial(c),h=k(i[u],l.getLength()-1).mod(l);for(a[u]=new Array(l.getLength()-1),g=0;g<a[u].length;g+=1){var s=g+h.getLength()-a[u].length;a[u][g]=s>=0?h.getAt(s):0}}var v=0;for(g=0;g<r.length;g+=1)v+=r[g].totalCount;var d=new Array(v),w=0;for(g=0;g<n;g+=1)for(u=0;u<r.length;u+=1)g<i[u].length&&(d[w]=i[u][g],w+=1);for(g=0;g<o;g+=1)for(u=0;u<r.length;u+=1)g<a[u].length&&(d[w]=a[u][g],w+=1);return d}(o,n)};f.addData=function(t,r){var e=null;switch(r=r||"Byte"){case"Numeric":e=M(t);break;case"Alphanumeric":e=x(t);break;case"Byte":e=m(t);break;case"Kanji":e=L(t);break;default:throw"mode:"+r}u.push(e),a=null},f.isDark=function(t,r){if(t<0||i<=t||r<0||i<=r)throw t+","+r;return o[t][r]},f.getModuleCount=function(){return i},f.make=function(){if(e<1){for(var t=1;t<40;t++){for(var r=A.getRSBlocks(t,n),o=b(),i=0;i<u.length;i++){var a=u[i];o.put(a.getMode(),4),o.put(a.getLength(),B.getLengthInBits(a.getMode(),t)),a.write(o)}var g=0;for(i=0;i<r.length;i++)g+=r[i].dataCount;if(o.getLengthInBits()<=8*g)break}e=t}c(!1,function(){for(var t=0,r=0,e=0;e<8;e+=1){c(!0,e);var n=B.getLostPoint(f);(0==e||t>n)&&(t=n,r=e)}return r}())},f.createTableTag=function(t,r){t=t||2;var e="";e+='<table style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: "+(r=void 0===r?4*t:r)+"px;",e+='">',e+="<tbody>";for(var n=0;n<f.getModuleCount();n+=1){e+="<tr>";for(var o=0;o<f.getModuleCount();o+=1)e+='<td style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: 0px;",e+=" width: "+t+"px;",e+=" height: "+t+"px;",e+=" background-color: ",e+=f.isDark(n,o)?"#000000":"#ffffff",e+=";",e+='"/>';e+="</tr>"}return e+="</tbody>",e+="</table>"},f.createSvgTag=function(t,r,e,n){var o={};"object"==typeof arguments[0]&&(t=(o=arguments[0]).cellSize,r=o.margin,e=o.alt,n=o.title),t=t||2,r=void 0===r?4*t:r,(e="string"==typeof e?{text:e}:e||{}).text=e.text||null,e.id=e.text?e.id||"qrcode-description":null,(n="string"==typeof n?{text:n}:n||{}).text=n.text||null,n.id=n.text?n.id||"qrcode-title":null;var i,a,u,c,g=f.getModuleCount()*t+2*r,l="";for(c="l"+t+",0 0,"+t+" -"+t+",0 0,-"+t+"z ",l+='<svg version="1.1" xmlns="http://www.w3.org/2000/svg"',l+=o.scalable?"":' width="'+g+'px" height="'+g+'px"',l+=' viewBox="0 0 '+g+" "+g+'" ',l+=' preserveAspectRatio="xMinYMin meet"',l+=n.text||e.text?' role="img" aria-labelledby="'+y([n.id,e.id].join(" ").trim())+'"':"",l+=">",l+=n.text?'<title id="'+y(n.id)+'">'+y(n.text)+"</title>":"",l+=e.text?'<description id="'+y(e.id)+'">'+y(e.text)+"</description>":"",l+='<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>',l+='<path d="',a=0;a<f.getModuleCount();a+=1)for(u=a*t+r,i=0;i<f.getModuleCount();i+=1)f.isDark(a,i)&&(l+="M"+(i*t+r)+","+u+c);return l+='" stroke="transparent" fill="black"/>',l+="</svg>"},f.createDataURL=function(t,r){t=t||2,r=void 0===r?4*t:r;var e=f.getModuleCount()*t+2*r,n=r,o=e-r;return I(e,e,(function(r,e){if(n<=r&&r<o&&n<=e&&e<o){var i=Math.floor((r-n)/t),a=Math.floor((e-n)/t);return f.isDark(a,i)?0:1}return 1}))},f.createImgTag=function(t,r,e){t=t||2,r=void 0===r?4*t:r;var n=f.getModuleCount()*t+2*r,o="";return o+="<img",o+=' src="',o+=f.createDataURL(t,r),o+='"',o+=' width="',o+=n,o+='"',o+=' height="',o+=n,o+='"',e&&(o+=' alt="',o+=y(e),o+='"'),o+="/>"};var y=function(t){for(var r="",e=0;e<t.length;e+=1){var n=t.charAt(e);switch(n){case"<":r+="&lt;";break;case">":r+="&gt;";break;case"&":r+="&amp;";break;case'"':r+="&quot;";break;default:r+=n}}return r};return f.createASCII=function(t,r){if((t=t||1)<2)return function(t){t=void 0===t?2:t;var r,e,n,o,i,a=1*f.getModuleCount()+2*t,u=t,c=a-t,g={"██":"█","█ ":"▀"," █":"▄","  ":" "},l={"██":"▀","█ ":"▀"," █":" ","  ":" "},h="";for(r=0;r<a;r+=2){for(n=Math.floor((r-u)/1),o=Math.floor((r+1-u)/1),e=0;e<a;e+=1)i="█",u<=e&&e<c&&u<=r&&r<c&&f.isDark(n,Math.floor((e-u)/1))&&(i=" "),u<=e&&e<c&&u<=r+1&&r+1<c&&f.isDark(o,Math.floor((e-u)/1))?i+=" ":i+="█",h+=t<1&&r+1>=c?l[i]:g[i];h+="\n"}return a%2&&t>0?h.substring(0,h.length-a-1)+Array(a+1).join("▀"):h.substring(0,h.length-1)}(r);t-=1,r=void 0===r?2*t:r;var e,n,o,i,a=f.getModuleCount()*t+2*r,u=r,c=a-r,g=Array(t+1).join("██"),l=Array(t+1).join("  "),h="",s="";for(e=0;e<a;e+=1){for(o=Math.floor((e-u)/t),s="",n=0;n<a;n+=1)i=1,u<=n&&n<c&&u<=e&&e<c&&f.isDark(o,Math.floor((n-u)/t))&&(i=0),s+=i?g:l;for(o=0;o<t;o+=1)h+=s+"\n"}return h.substring(0,h.length-1)},f.renderTo2dContext=function(t,r){r=r||2;for(var e=f.getModuleCount(),n=0;n<e;n++)for(var o=0;o<e;o++)t.fillStyle=f.isDark(n,o)?"black":"white",t.fillRect(n*r,o*r,r,r)},f};t.stringToBytes=(t.stringToBytesFuncs={default:function(t){for(var r=[],e=0;e<t.length;e+=1){var n=t.charCodeAt(e);r.push(255&n)}return r}}).default,t.createStringToBytes=function(t,r){var e=function(){for(var e=S(t),n=function(){var t=e.read();if(-1==t)throw"eof";return t},o=0,i={};;){var a=e.read();if(-1==a)break;var u=n(),f=n()<<8|n();i[String.fromCharCode(a<<8|u)]=f,o+=1}if(o!=r)throw o+" != "+r;return i}(),n="?".charCodeAt(0);return function(t){for(var r=[],o=0;o<t.length;o+=1){var i=t.charCodeAt(o);if(i<128)r.push(i);else{var a=e[t.charAt(o)];"number"==typeof a?(255&a)==a?r.push(a):(r.push(a>>>8),r.push(255&a)):r.push(n)}}return r}};var r,e,n,o,i,a=1,u=2,f=4,c=8,g={L:1,M:0,Q:3,H:2},l=0,h=1,s=2,v=3,d=4,w=5,p=6,y=7,B=(r=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],e=1335,n=7973,i=function(t){for(var r=0;0!=t;)r+=1,t>>>=1;return r},(o={}).getBCHTypeInfo=function(t){for(var r=t<<10;i(r)-i(e)>=0;)r^=e<<i(r)-i(e);return 21522^(t<<10|r)},o.getBCHTypeNumber=function(t){for(var r=t<<12;i(r)-i(n)>=0;)r^=n<<i(r)-i(n);return t<<12|r},o.getPatternPosition=function(t){return r[t-1]},o.getMaskFunction=function(t){switch(t){case l:return function(t,r){return(t+r)%2==0};case h:return function(t,r){return t%2==0};case s:return function(t,r){return r%3==0};case v:return function(t,r){return(t+r)%3==0};case d:return function(t,r){return(Math.floor(t/2)+Math.floor(r/3))%2==0};case w:return function(t,r){return t*r%2+t*r%3==0};case p:return function(t,r){return(t*r%2+t*r%3)%2==0};case y:return function(t,r){return(t*r%3+(t+r)%2)%2==0};default:throw"bad maskPattern:"+t}},o.getErrorCorrectPolynomial=function(t){for(var r=k([1],0),e=0;e<t;e+=1)r=r.multiply(k([1,C.gexp(e)],0));return r},o.getLengthInBits=function(t,r){if(1<=r&&r<10)switch(t){case a:return 10;case u:return 9;case f:case c:return 8;default:throw"mode:"+t}else if(r<27)switch(t){case a:return 12;case u:return 11;case f:return 16;case c:return 10;default:throw"mode:"+t}else{if(!(r<41))throw"type:"+r;switch(t){case a:return 14;case u:return 13;case f:return 16;case c:return 12;default:throw"mode:"+t}}},o.getLostPoint=function(t){for(var r=t.getModuleCount(),e=0,n=0;n<r;n+=1)for(var o=0;o<r;o+=1){for(var i=0,a=t.isDark(n,o),u=-1;u<=1;u+=1)if(!(n+u<0||r<=n+u))for(var f=-1;f<=1;f+=1)o+f<0||r<=o+f||0==u&&0==f||a==t.isDark(n+u,o+f)&&(i+=1);i>5&&(e+=3+i-5)}for(n=0;n<r-1;n+=1)for(o=0;o<r-1;o+=1){var c=0;t.isDark(n,o)&&(c+=1),t.isDark(n+1,o)&&(c+=1),t.isDark(n,o+1)&&(c+=1),t.isDark(n+1,o+1)&&(c+=1),0!=c&&4!=c||(e+=3)}for(n=0;n<r;n+=1)for(o=0;o<r-6;o+=1)t.isDark(n,o)&&!t.isDark(n,o+1)&&t.isDark(n,o+2)&&t.isDark(n,o+3)&&t.isDark(n,o+4)&&!t.isDark(n,o+5)&&t.isDark(n,o+6)&&(e+=40);for(o=0;o<r;o+=1)for(n=0;n<r-6;n+=1)t.isDark(n,o)&&!t.isDark(n+1,o)&&t.isDark(n+2,o)&&t.isDark(n+3,o)&&t.isDark(n+4,o)&&!t.isDark(n+5,o)&&t.isDark(n+6,o)&&(e+=40);var g=0;for(o=0;o<r;o+=1)for(n=0;n<r;n+=1)t.isDark(n,o)&&(g+=1);return e+=Math.abs(100*g/r/r-50)/5*10},o),C=function(){for(var t=new Array(256),r=new Array(256),e=0;e<8;e+=1)t[e]=1<<e;for(e=8;e<256;e+=1)t[e]=t[e-4]^t[e-5]^t[e-6]^t[e-8];for(e=0;e<255;e+=1)r[t[e]]=e;var n={glog:function(t){if(t<1)throw"glog("+t+")";return r[t]},gexp:function(r){for(;r<0;)r+=255;for(;r>=256;)r-=255;return t[r]}};return n}();function k(t,r){if(void 0===t.length)throw t.length+"/"+r;var e=function(){for(var e=0;e<t.length&&0==t[e];)e+=1;for(var n=new Array(t.length-e+r),o=0;o<t.length-e;o+=1)n[o]=t[o+e];return n}(),n={getAt:function(t){return e[t]},getLength:function(){return e.length},multiply:function(t){for(var r=new Array(n.getLength()+t.getLength()-1),e=0;e<n.getLength();e+=1)for(var o=0;o<t.getLength();o+=1)r[e+o]^=C.gexp(C.glog(n.getAt(e))+C.glog(t.getAt(o)));return k(r,0)},mod:function(t){if(n.getLength()-t.getLength()<0)return n;for(var r=C.glog(n.getAt(0))-C.glog(t.getAt(0)),e=new Array(n.getLength()),o=0;o<n.getLength();o+=1)e[o]=n.getAt(o);for(o=0;o<t.getLength();o+=1)e[o]^=C.gexp(C.glog(t.getAt(o))+r);return k(e,0).mod(t)}};return n}var A=function(){var t=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12,7,37,13],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],r=function(t,r){var e={};return e.totalCount=t,e.dataCount=r,e},e={};return e.getRSBlocks=function(e,n){var o=function(r,e){switch(e){case g.L:return t[4*(r-1)+0];case g.M:return t[4*(r-1)+1];case g.Q:return t[4*(r-1)+2];case g.H:return t[4*(r-1)+3];default:return}}(e,n);if(void 0===o)throw"bad rs block @ typeNumber:"+e+"/errorCorrectionLevel:"+n;for(var i=o.length/3,a=[],u=0;u<i;u+=1)for(var f=o[3*u+0],c=o[3*u+1],l=o[3*u+2],h=0;h<f;h+=1)a.push(r(c,l));return a},e}(),b=function(){var t=[],r=0,e={getBuffer:function(){return t},getAt:function(r){var e=Math.floor(r/8);return 1==(t[e]>>>7-r%8&1)},put:function(t,r){for(var n=0;n<r;n+=1)e.putBit(1==(t>>>r-n-1&1))},getLengthInBits:function(){return r},putBit:function(e){var n=Math.floor(r/8);t.length<=n&&t.push(0),e&&(t[n]|=128>>>r%8),r+=1}};return e},M=function(t){var r=a,e=t,n={getMode:function(){return r},getLength:function(t){return e.length},write:function(t){for(var r=e,n=0;n+2<r.length;)t.put(o(r.substring(n,n+3)),10),n+=3;n<r.length&&(r.length-n==1?t.put(o(r.substring(n,n+1)),4):r.length-n==2&&t.put(o(r.substring(n,n+2)),7))}},o=function(t){for(var r=0,e=0;e<t.length;e+=1)r=10*r+i(t.charAt(e));return r},i=function(t){if("0"<=t&&t<="9")return t.charCodeAt(0)-"0".charCodeAt(0);throw"illegal char :"+t};return n},x=function(t){var r=u,e=t,n={getMode:function(){return r},getLength:function(t){return e.length},write:function(t){for(var r=e,n=0;n+1<r.length;)t.put(45*o(r.charAt(n))+o(r.charAt(n+1)),11),n+=2;n<r.length&&t.put(o(r.charAt(n)),6)}},o=function(t){if("0"<=t&&t<="9")return t.charCodeAt(0)-"0".charCodeAt(0);if("A"<=t&&t<="Z")return t.charCodeAt(0)-"A".charCodeAt(0)+10;switch(t){case" ":return 36;case"$":return 37;case"%":return 38;case"*":return 39;case"+":return 40;case"-":return 41;case".":return 42;case"/":return 43;case":":return 44;default:throw"illegal char :"+t}};return n},m=function(r){var e=f,n=t.stringToBytes(r),o={getMode:function(){return e},getLength:function(t){return n.length},write:function(t){for(var r=0;r<n.length;r+=1)t.put(n[r],8)}};return o},L=function(r){var e=c,n=t.stringToBytesFuncs.SJIS;if(!n)throw"sjis not supported.";!function(){var t=n("友");if(2!=t.length||38726!=(t[0]<<8|t[1]))throw"sjis not supported."}();var o=n(r),i={getMode:function(){return e},getLength:function(t){return~~(o.length/2)},write:function(t){for(var r=o,e=0;e+1<r.length;){var n=(255&r[e])<<8|255&r[e+1];if(33088<=n&&n<=40956)n-=33088;else{if(!(57408<=n&&n<=60351))throw"illegal char at "+(e+1)+"/"+n;n-=49472}n=192*(n>>>8&255)+(255&n),t.put(n,13),e+=2}if(e<r.length)throw"illegal char at "+(e+1)}};return i},D=function(){var t=[],r={writeByte:function(r){t.push(255&r)},writeShort:function(t){r.writeByte(t),r.writeByte(t>>>8)},writeBytes:function(t,e,n){e=e||0,n=n||t.length;for(var o=0;o<n;o+=1)r.writeByte(t[o+e])},writeString:function(t){for(var e=0;e<t.length;e+=1)r.writeByte(t.charCodeAt(e))},toByteArray:function(){return t},toString:function(){var r="";r+="[";for(var e=0;e<t.length;e+=1)e>0&&(r+=","),r+=t[e];return r+="]"}};return r},S=function(t){var r=t,e=0,n=0,o=0,i={read:function(){for(;o<8;){if(e>=r.length){if(0==o)return-1;throw"unexpected end of file./"+o}var t=r.charAt(e);if(e+=1,"="==t)return o=0,-1;t.match(/^\s$/)||(n=n<<6|a(t.charCodeAt(0)),o+=6)}var i=n>>>o-8&255;return o-=8,i}},a=function(t){if(65<=t&&t<=90)return t-65;if(97<=t&&t<=122)return t-97+26;if(48<=t&&t<=57)return t-48+52;if(43==t)return 62;if(47==t)return 63;throw"c:"+t};return i},I=function(t,r,e){for(var n=function(t,r){var e=t,n=r,o=new Array(t*r),i={setPixel:function(t,r,n){o[r*e+t]=n},write:function(t){t.writeString("GIF87a"),t.writeShort(e),t.writeShort(n),t.writeByte(128),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(255),t.writeByte(255),t.writeByte(255),t.writeString(","),t.writeShort(0),t.writeShort(0),t.writeShort(e),t.writeShort(n),t.writeByte(0);var r=a(2);t.writeByte(2);for(var o=0;r.length-o>255;)t.writeByte(255),t.writeBytes(r,o,255),o+=255;t.writeByte(r.length-o),t.writeBytes(r,o,r.length-o),t.writeByte(0),t.writeString(";")}},a=function(t){for(var r=1<<t,e=1+(1<<t),n=t+1,i=u(),a=0;a<r;a+=1)i.add(String.fromCharCode(a));i.add(String.fromCharCode(r)),i.add(String.fromCharCode(e));var f,c,g,l=D(),h=(f=l,c=0,g=0,{write:function(t,r){if(t>>>r!=0)throw"length over";for(;c+r>=8;)f.writeByte(255&(t<<c|g)),r-=8-c,t>>>=8-c,g=0,c=0;g|=t<<c,c+=r},flush:function(){c>0&&f.writeByte(g)}});h.write(r,n);var s=0,v=String.fromCharCode(o[s]);for(s+=1;s<o.length;){var d=String.fromCharCode(o[s]);s+=1,i.contains(v+d)?v+=d:(h.write(i.indexOf(v),n),i.size()<4095&&(i.size()==1<<n&&(n+=1),i.add(v+d)),v=d)}return h.write(i.indexOf(v),n),h.write(e,n),h.flush(),l.toByteArray()},u=function(){var t={},r=0,e={add:function(n){if(e.contains(n))throw"dup key:"+n;t[n]=r,r+=1},size:function(){return r},indexOf:function(r){return t[r]},contains:function(r){return void 0!==t[r]}};return e};return i}(t,r),o=0;o<r;o+=1)for(var i=0;i<t;i+=1)n.setPixel(i,o,e(i,o));var a=D();n.write(a);for(var u=function(){var t=0,r=0,e=0,n="",o={},i=function(t){n+=String.fromCharCode(a(63&t))},a=function(t){if(t<0);else{if(t<26)return 65+t;if(t<52)return t-26+97;if(t<62)return t-52+48;if(62==t)return 43;if(63==t)return 47}throw"n:"+t};return o.writeByte=function(n){for(t=t<<8|255&n,r+=8,e+=1;r>=6;)i(t>>>r-6),r-=6},o.flush=function(){if(r>0&&(i(t<<6-r),t=0,r=0),e%3!=0)for(var o=3-e%3,a=0;a<o;a+=1)n+="="},o.toString=function(){return n},o}(),f=a.toByteArray(),c=0;c<f.length;c+=1)u.writeByte(f[c]);return u.flush(),"data:image/gif;base64,"+u};return t}();qrcode.stringToBytesFuncs["UTF-8"]=function(t){return function(t){for(var r=[],e=0;e<t.length;e++){var n=t.charCodeAt(e);n<128?r.push(n):n<2048?r.push(192|n>>6,128|63&n):n<55296||n>=57344?r.push(224|n>>12,128|n>>6&63,128|63&n):(e++,n=65536+((1023&n)<<10|1023&t.charCodeAt(e)),r.push(240|n>>18,128|n>>12&63,128|n>>6&63,128|63&n))}return r}(t)},function(t){"function"==typeof define&&define.amd?define([],t):"object"==typeof exports&&(module.exports=t())}((function(){return qrcode}));
if(typeof window!=='undefined'){window.qrcode=qrcode;}
if(typeof globalThis!=='undefined'){globalThis.qrcode=qrcode;}
//# sourceMappingURL=/sm/26b4b0d0b1e283d6b3ec9857ac597d7a60c76ac17be1ef4c965f03086de426bb.map

(function (window) {
  'use strict';

  const STORAGE_KEY_TOKEN = 'oumusic_gh_token';
  const STORAGE_KEY_USER = 'oumusic_gh_user';
  const STORAGE_KEY_LAST_SYNC = 'oumusic_gh_last_sync';
  const STORAGE_KEY_SHA = 'oumusic_gh_sha';
  const STORAGE_KEY_DIRTY = 'oumusic_sync_dirty';

  const REPO_NAME = 'oumusic-sync';
  const DATA_FILE_PATH = 'account-data.json';
  const DEBOUNCE_DELAY_MS = 6500; // 6.5s debounce (between 5 and 8 seconds)

  let syncDebounceTimer = null;
  let isSyncInProgress = false;
  let hasPendingSync = false;

  // UTF-8 safe base64 encoding and decoding
  function utf8ToBase64(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  }

  function base64ToUtf8(str) {
    const cleanStr = (str || '').replace(/\s+/g, '');
    return decodeURIComponent(atob(cleanStr).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }

  // Robust Direct IndexedDB Helpers for Cloud Sync
  function openIDB() {
    return new Promise((resolve) => {
      try {
        const req = indexedDB.open('oumusic_db', 1);
        req.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('tracks_metadata')) db.createObjectStore('tracks_metadata', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('offline_tracks')) db.createObjectStore('offline_tracks', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('likes')) db.createObjectStore('likes', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('playlists')) db.createObjectStore('playlists', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('history')) {
            const hist = db.createObjectStore('history', { keyPath: 'histId', autoIncrement: true });
            hist.createIndex('playedAt', 'playedAt', { unique: false });
          }
          if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
          if (!db.objectStoreNames.contains('recap_snapshots')) db.createObjectStore('recap_snapshots', { keyPath: 'year' });
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  async function getIDBStore(storeName, mode = 'readonly') {
    if (typeof window.getStore === 'function') {
      const s = window.getStore(storeName, mode);
      if (s) return s;
    }
    const db = await openIDB();
    if (!db) return null;
    try {
      const tx = db.transaction(storeName, mode);
      return tx.objectStore(storeName);
    } catch (e) {
      return null;
    }
  }

  async function idbGetAll(storeName) {
    const store = await getIDBStore(storeName, 'readonly');
    if (!store) return [];
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  async function idbPutAll(storeName, items) {
    if (!Array.isArray(items) || items.length === 0) return true;
    const store = await getIDBStore(storeName, 'readwrite');
    if (!store) return false;
    return new Promise((resolve) => {
      let pending = items.length;
      if (pending === 0) return resolve(true);
      for (const item of items) {
        if (!item) {
          pending--;
          if (pending <= 0) resolve(true);
          continue;
        }
        const req = store.put(item);
        req.onsuccess = req.onerror = () => {
          pending--;
          if (pending <= 0) resolve(true);
        };
      }
    });
  }

  async function idbDelete(storeName, key) {
    const store = await getIDBStore(storeName, 'readwrite');
    if (!store) return false;
    return new Promise((resolve) => {
      const req = store.delete(key);
      req.onsuccess = req.onerror = () => resolve(true);
    });
  }

  const OUMusicCloudSync = {
    getToken() {
      try {
        return (localStorage.getItem(STORAGE_KEY_TOKEN) || '').trim();
      } catch (e) {
        return '';
      }
    },

    setToken(token) {
      try {
        if (token) {
          localStorage.setItem(STORAGE_KEY_TOKEN, token.trim());
        } else {
          localStorage.removeItem(STORAGE_KEY_TOKEN);
        }
      } catch (e) {}
    },

    getUser() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_USER);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    setUser(userObj) {
      try {
        if (userObj) {
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userObj));
        } else {
          localStorage.removeItem(STORAGE_KEY_USER);
        }
      } catch (e) {}
    },

    getLastSyncTime() {
      try {
        return localStorage.getItem(STORAGE_KEY_LAST_SYNC) || null;
      } catch (e) {
        return null;
      }
    },

    setLastSyncTime(isoStr) {
      try {
        localStorage.setItem(STORAGE_KEY_LAST_SYNC, isoStr || new Date().toISOString());
      } catch (e) {}
    },

    getFileSha() {
      try {
        return localStorage.getItem(STORAGE_KEY_SHA) || '';
      } catch (e) {
        return '';
      }
    },

    setFileSha(sha) {
      try {
        if (sha) {
          localStorage.setItem(STORAGE_KEY_SHA, sha);
        } else {
          localStorage.removeItem(STORAGE_KEY_SHA);
        }
      } catch (e) {}
    },

    isLoggedIn() {
      return Boolean(this.getToken() && this.getUser());
    },

    /**
     * Authenticates with GitHub PAT, creates oumusic-sync if absent,
     * smart-merges cloud account-data.json with local data, and starts live sync.
     */
    async loginWithToken(rawToken) {
      const token = (rawToken || '').trim();
      if (!token) {
        throw new Error('Токен не может быть пустым');
      }

      // 1. Fetch user profile
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      if (!userRes.ok) {
        if (userRes.status === 401) {
          throw new Error('Неверный или отозванный токен GitHub. Проверьте правильность ключа.');
        } else if (userRes.status === 403) {
          throw new Error('Доступ ограничен GitHub API (превышен лимит запросов или нет прав repo).');
        } else {
          throw new Error(`Ошибка проверки токена (${userRes.status}).`);
        }
      }

      const userData = await userRes.json();
      const userObj = {
        login: userData.login,
        name: userData.name || userData.login,
        avatar_url: userData.avatar_url || ''
      };

      this.setToken(token);
      this.setUser(userObj);

      // 2. Ensure private repository oumusic-sync exists
      await this.ensureRepository(token, userObj.login);

      // 3. Load, smart-merge and push cloud data
      await this.initialSync(token, userObj.login);

      // 4. Update UI
      this.updateUI();

      return userObj;
    },

    /**
     * Ensures private repository exists, auto-creating it if not found.
     */
    async ensureRepository(token, ownerLogin) {
      const repoUrl = `https://api.github.com/repos/${ownerLogin}/${REPO_NAME}`;
      const checkRes = await fetch(repoUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (checkRes.ok) {
        return true;
      }

      if (checkRes.status === 404) {
        // Create private repo with auto_init (README)
        const createRes = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: REPO_NAME,
            description: 'ouMusic cloud backup database',
            private: true,
            auto_init: true
          })
        });

        if (!createRes.ok) {
          const errData = await createRes.json().catch(() => ({}));
          throw new Error(`Не удалось создать приватный репозиторий: ${errData.message || createRes.statusText}`);
        }

        // Wait 1.5 seconds for GitHub to finish repo initialization
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return true;
      }

      throw new Error(`Ошибка проверки репозитория oumusic-sync (${checkRes.status}).`);
    },

    /**
     * Initial pull, smart merge with existing local data, and initial commit.
     */
    async initialSync(token, ownerLogin) {
      const fileUrl = `https://api.github.com/repos/${ownerLogin}/${REPO_NAME}/contents/${DATA_FILE_PATH}`;
      const getRes = await fetch(fileUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      const localData = await this.collectLocalData();

      if (getRes.status === 404) {
        // First ever cloud sync: push current local data to GitHub
        const b64 = utf8ToBase64(JSON.stringify(localData, null, 2));
        const putRes = await fetch(fileUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: 'Initial ouMusic cloud database',
            content: b64
          })
        });

        if (putRes.ok) {
          const putData = await putRes.json();
          if (putData.content && putData.content.sha) {
            this.setFileSha(putData.content.sha);
          }
          this.setLastSyncTime(new Date().toISOString());
        }
        return;
      }

      if (getRes.ok) {
        const fileData = await getRes.json();
        const currentSha = fileData.sha || '';
        this.setFileSha(currentSha);

        try {
          const remoteJsonStr = base64ToUtf8(fileData.content || '');
          const remoteData = JSON.parse(remoteJsonStr);

          // Smart merge local and remote data
          const mergedData = await this.smartMerge(localData, remoteData);

          // Save merged data locally
          await this.applyDataLocally(mergedData);

          // Push merged data back to GitHub
          const b64 = utf8ToBase64(JSON.stringify(mergedData, null, 2));
          const putRes = await fetch(fileUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: 'Smart merge ouMusic cloud database [skip ci]',
              content: b64,
              sha: currentSha
            })
          });

          if (putRes.ok) {
            const putData = await putRes.json();
            if (putData.content && putData.content.sha) {
              this.setFileSha(putData.content.sha);
            }
          }
          this.setLastSyncTime(new Date().toISOString());
        } catch (err) {
          console.error('[CloudSync] Error parsing or merging remote data:', err);
        }
      }
    },

    /**
     * Collects all user data from IndexedDB & LocalStorage.
     */
    async collectLocalData() {
      let likes = [];
      let playlists = [];
      let history = [];
      let blacklist = [];
      let manualTracks = [];

      // 1. Playlists
      try {
        if (typeof window.getAllPlaylistsAsync === 'function') {
          playlists = await window.getAllPlaylistsAsync();
        } else {
          playlists = await idbGetAll('playlists');
        }
      } catch (e) {
        playlists = await idbGetAll('playlists');
      }

      // 2. Likes
      try {
        if (typeof window.getAllLikes === 'function') {
          likes = await window.getAllLikes();
        } else {
          likes = await idbGetAll('likes');
        }
      } catch (e) {
        likes = await idbGetAll('likes');
      }

      // 3. History
      try {
        if (typeof window.getHistory === 'function') {
          history = await window.getHistory(30);
        } else {
          const h = await idbGetAll('history');
          h.sort((a, b) => new Date(b.playedAt || 0) - new Date(a.playedAt || 0));
          history = h.slice(0, 30);
        }
      } catch (e) {
        const h = await idbGetAll('history');
        history = h.slice(0, 30);
      }

      history = (Array.isArray(history) ? history : [])
        .filter((h) => h && h.trackId)
        .sort((a, b) => new Date(b.playedAt || 0) - new Date(a.playedAt || 0))
        .slice(0, 30)
        .map((h) => ({
          trackId: h.trackId,
          durationPlayed: Math.round(Number(h.durationPlayed) || 0),
          playedAt: h.playedAt || new Date().toISOString()
        }));

      // 4. Blacklist
      try {
        if (typeof window.getBlacklist === 'function') {
          blacklist = await window.getBlacklist();
        } else {
          const rawBl = localStorage.getItem('ou_blacklist_track_ids');
          if (rawBl) blacklist = JSON.parse(rawBl);
        }
      } catch (e) {}

      // 5. Manual Local Tracks Metadata
      try {
        if (typeof window.getAllTracksMetadata === 'function') {
          const allMeta = await window.getAllTracksMetadata();
          manualTracks = allMeta.filter(t => t && t.isLocal);
        } else {
          const allMeta = await idbGetAll('tracks_metadata');
          manualTracks = allMeta.filter(t => t && t.isLocal);
        }
      } catch (e) {}
      if (manualTracks.length === 0 && Array.isArray(window.catalogTracks)) {
        manualTracks = window.catalogTracks.filter(t => t && t.isLocal);
      }

      // Calculate total playback stats
      let histSecs = 0;
      history.forEach(h => { histSecs += (Number(h.durationPlayed) || 0); });
      const storedSecs = Number(localStorage.getItem('oumusic_total_seconds') || 0);
      const totalSeconds = Math.max(histSecs, storedSecs);
      const storedPlays = Number(localStorage.getItem('oumusic_total_plays') || 0);
      const totalPlays = Math.max(history.length, storedPlays);
      const nowD = new Date();
      const monthKey = `${nowD.getFullYear()}_${String(nowD.getMonth() + 1).padStart(2, '0')}`;
      const storedMonthSecs = Number(localStorage.getItem(`oumusic_month_seconds_${monthKey}`) || 0);

      // Settings & Preferences
      const settings = {
        theme: localStorage.getItem('oumusic_theme') || 'dark',
        amoled: localStorage.getItem('oumusic_amoled') || 'false',
        liquidGlass: localStorage.getItem('oumusic_liquid_glass') || 'true',
        userName: localStorage.getItem('oumusic_user_name') || '',
        userAvatar: localStorage.getItem('oumusic_user_avatar') || '',
        boundArtist: localStorage.getItem('oumusic_bound_artist') || '',
        eqBassGain: localStorage.getItem('ou_eq_bass') || '0',
        eqMidGain: localStorage.getItem('ou_eq_mid') || '0',
        eqTrebleGain: localStorage.getItem('ou_eq_treble') || '0',
        eqPreset: localStorage.getItem('ou_eq_preset') || 'flat'
      };

      const stats = {
        totalSeconds: totalSeconds,
        totalHours: Number((totalSeconds / 3600).toFixed(2)),
        totalPlays: totalPlays,
        monthKey: monthKey,
        monthSeconds: storedMonthSecs
      };

      return {
        app: 'ouMusic',
        schemaVersion: 2,
        exportedAt: new Date().toISOString(),
        likes: likes || [],
        playlists: playlists || [],
        history: history || [],
        blacklist: blacklist || [],
        manualTracks: manualTracks || [],
        settings: settings,
        stats: stats
      };
    },

    /**
     * Smart merge algorithm:
     * - Playlists: union by ID, taking newer updatedAt for conflicts, preserving custom covers/tracks
     * - Likes: union of track IDs (no likes lost)
     * - History: union by (trackId + playedAt), sorted descending, trimmed to 1000
     * - Blacklist: union of disliked track IDs
     * - ManualTracks: union by track ID
     * - Settings: preference map with timestamp priority
     * - Stats: sum hours for newly syncing devices, max/delta otherwise
     */
    async smartMerge(local, remote) {
      if (!remote || typeof remote !== 'object') return local;

      // 1. Playlists merge
      const plMap = new Map();
      const localPls = Array.isArray(local.playlists) ? local.playlists : [];
      const remotePls = Array.isArray(remote.playlists) ? remote.playlists : [];

      localPls.forEach((pl) => {
        if (pl && pl.id) plMap.set(pl.id, Object.assign({}, pl));
      });

      remotePls.forEach((rPl) => {
        if (!rPl || !rPl.id) return;
        if (!plMap.has(rPl.id)) {
          plMap.set(rPl.id, Object.assign({}, rPl));
        } else {
          const lPl = plMap.get(rPl.id);
          const lTime = new Date(lPl.updatedAt || lPl.createdAt || 0).getTime();
          const rTime = new Date(rPl.updatedAt || rPl.createdAt || 0).getTime();
          if (rTime > lTime) {
            plMap.set(rPl.id, Object.assign({}, rPl));
          } else {
            const combinedTracks = Array.from(new Set([...(lPl.trackIds || []), ...(rPl.trackIds || [])]));
            lPl.trackIds = combinedTracks;
            if (rPl.coverBase64 && !lPl.coverBase64) lPl.coverBase64 = rPl.coverBase64;
            if (rPl.description && !lPl.description) lPl.description = rPl.description;
            plMap.set(rPl.id, lPl);
          }
        }
      });

      // Filter out explicitly deleted playlists
      const deletedIds = new Set();
      for (const [id, pl] of plMap.entries()) {
        if (pl._deleted || pl.deleted) {
          deletedIds.add(id);
          plMap.delete(id);
        }
      }

      // 2. Likes merge
      const likesMap = new Map();
      const localLikes = Array.isArray(local.likes) ? local.likes : [];
      const remoteLikes = Array.isArray(remote.likes) ? remote.likes : [];

      localLikes.forEach((l) => {
        const id = typeof l === 'string' ? l : (l && l.id);
        if (id) likesMap.set(id, typeof l === 'string' ? { id: l, likedAt: new Date().toISOString() } : l);
      });

      remoteLikes.forEach((r) => {
        const id = typeof r === 'string' ? r : (r && r.id);
        if (id && !likesMap.has(id)) {
          likesMap.set(id, typeof r === 'string' ? { id: r, likedAt: new Date().toISOString() } : r);
        }
      });

      // 3. History merge (all unique played tracks by id + timestamp, capped at 30)
      const histMap = new Map();
      const localHist = Array.isArray(local.history) ? local.history : [];
      const remoteHist = Array.isArray(remote.history) ? remote.history : [];

      [...localHist, ...remoteHist].forEach((h) => {
        if (h && h.trackId && h.playedAt) {
          const key = `${h.trackId}_${h.playedAt}`;
          histMap.set(key, {
            trackId: h.trackId,
            durationPlayed: Math.round(Number(h.durationPlayed) || 0),
            playedAt: h.playedAt
          });
        }
      });

      const mergedHist = Array.from(histMap.values())
        .sort((a, b) => new Date(b.playedAt || 0) - new Date(a.playedAt || 0))
        .slice(0, 30);

      // 4. Blacklist merge
      const localBl = Array.isArray(local.blacklist) ? local.blacklist : [];
      const remoteBl = Array.isArray(remote.blacklist) ? remote.blacklist : [];
      const mergedBl = Array.from(new Set([...localBl, ...remoteBl]));

      // 5. Manual Tracks merge
      const trackMap = new Map();
      const localTracks = Array.isArray(local.manualTracks) ? local.manualTracks : [];
      const remoteTracks = Array.isArray(remote.manualTracks) ? remote.manualTracks : [];

      localTracks.forEach((t) => { if (t && t.id) trackMap.set(t.id, t); });
      remoteTracks.forEach((t) => { if (t && t.id && !trackMap.has(t.id)) trackMap.set(t.id, t); });
      const mergedManualTracks = Array.from(trackMap.values());

      // 6. Settings merge
      const lSet = local.settings || {};
      const rSet = remote.settings || {};
      const rTime = new Date(remote.exportedAt || 0).getTime();
      const lTime = new Date(local.exportedAt || 0).getTime();
      const preferRemote = rTime > lTime || !this.getLastSyncTime();

      const mergedSettings = preferRemote
        ? Object.assign({}, lSet, rSet)
        : Object.assign({}, rSet, lSet);

      if (!mergedSettings.userName) mergedSettings.userName = rSet.userName || lSet.userName || '';
      if (!mergedSettings.userAvatar) mergedSettings.userAvatar = rSet.userAvatar || lSet.userAvatar || '';
      if (!mergedSettings.theme) mergedSettings.theme = rSet.theme || lSet.theme || 'dark';

      // 7. Statistics merge (Summing hours if device was unsynced!)
      const lSecs = Number(local.stats?.totalSeconds || 0);
      const rSecs = Number(remote.stats?.totalSeconds || 0);
      const lPlays = Number(local.stats?.totalPlays || 0);
      const rPlays = Number(remote.stats?.totalPlays || 0);

      const isFirstSync = !this.getLastSyncTime();
      let mergedSeconds = 0;
      let mergedPlays = 0;

      if (isFirstSync) {
        mergedSeconds = rSecs + lSecs;
        mergedPlays = rPlays + lPlays;
      } else {
        mergedSeconds = Math.max(rSecs, lSecs);
        mergedPlays = Math.max(rPlays, lPlays);
      }

      let histSecsSum = 0;
      mergedHist.forEach(h => { histSecsSum += (Number(h.durationPlayed) || 0); });
      mergedSeconds = Math.max(mergedSeconds, histSecsSum);

      const curNow = new Date();
      const curMonthKey = `${curNow.getFullYear()}_${String(curNow.getMonth() + 1).padStart(2, '0')}`;
      const lMonthSecs = (local.stats?.monthKey === curMonthKey) ? Number(local.stats?.monthSeconds || 0) : 0;
      const rMonthSecs = (remote.stats?.monthKey === curMonthKey) ? Number(remote.stats?.monthSeconds || 0) : 0;
      const mergedMonthSecs = isFirstSync ? (rMonthSecs + lMonthSecs) : Math.max(rMonthSecs, lMonthSecs);

      const mergedStats = {
        totalSeconds: mergedSeconds,
        totalHours: Number((mergedSeconds / 3600).toFixed(2)),
        totalPlays: Math.max(mergedPlays, mergedHist.length),
        monthKey: curMonthKey,
        monthSeconds: mergedMonthSecs
      };

      return {
        app: 'ouMusic',
        schemaVersion: 2,
        exportedAt: new Date().toISOString(),
        likes: Array.from(likesMap.values()),
        playlists: Array.from(plMap.values()),
        deletedPlaylistIds: Array.from(deletedIds),
        history: mergedHist,
        blacklist: mergedBl,
        manualTracks: mergedManualTracks,
        settings: mergedSettings,
        stats: mergedStats
      };
    },

    /**
     * Applies merged dataset into local IndexedDB and LocalStorage.
     */
    async applyDataLocally(data) {
      if (!data) return;

      // 1. Playlists
      if (Array.isArray(data.playlists)) {
        try {
          await idbPutAll('playlists', data.playlists);
        } catch (e) {
          console.warn('[CloudSync] Error saving playlists:', e);
        }
      }
      if (Array.isArray(data.deletedPlaylistIds)) {
        for (const delId of data.deletedPlaylistIds) {
          await idbDelete('playlists', delId);
        }
      }

      // 2. Likes
      if (Array.isArray(data.likes)) {
        try {
          const formattedLikes = data.likes.map((l) => {
            return typeof l === 'string' ? { id: l, likedAt: new Date().toISOString() } : l;
          }).filter(l => l && l.id);
          await idbPutAll('likes', formattedLikes);
        } catch (e) {
          console.warn('[CloudSync] Error saving likes:', e);
        }
      }

      // 3. History (replace with latest 30 entries cleanly)
      if (Array.isArray(data.history)) {
        try {
          const validHist = data.history
            .filter(h => h && h.trackId)
            .sort((a, b) => new Date(b.playedAt || 0) - new Date(a.playedAt || 0))
            .slice(0, 30)
            .map((h) => ({
              trackId: h.trackId,
              durationPlayed: Math.round(Number(h.durationPlayed) || 0),
              playedAt: h.playedAt || new Date().toISOString()
            }));
          const histStore = await getIDBStore('history', 'readwrite');
          if (histStore) {
            await new Promise((resolve) => {
              const clr = histStore.clear();
              clr.onsuccess = clr.onerror = () => resolve(true);
            });
            if (validHist.length > 0) {
              await idbPutAll('history', validHist);
            }
          }
        } catch (e) {
          console.warn('[CloudSync] Error saving history:', e);
        }
      }

      // 4. Manual Local Tracks
      if (Array.isArray(data.manualTracks)) {
        try {
          for (const tr of data.manualTracks) {
            if (tr && tr.id) {
              tr.isLocal = true;
              if (typeof window.saveTrackMetadata === 'function') {
                await window.saveTrackMetadata(tr);
              } else {
                await idbPutAll('tracks_metadata', [tr]);
              }
              if (Array.isArray(window.catalogTracks) && !window.catalogTracks.some(t => t.id === tr.id)) {
                window.catalogTracks.push(tr);
              }
            }
          }
          if (typeof window.renderManualTracksFeed === 'function') {
            window.renderManualTracksFeed();
          }
        } catch (e) {}
      }

      // 5. Blacklist
      if (Array.isArray(data.blacklist)) {
        try {
          localStorage.setItem('ou_blacklist_track_ids', JSON.stringify(data.blacklist));
          if (typeof window.saveSetting === 'function') {
            await window.saveSetting('blacklist_track_ids', data.blacklist);
          }
        } catch (e) {}
      }

      // 6. Settings (Theme, Avatar, Nickname, AMOLED, etc.)
      if (data.settings && typeof data.settings === 'object') {
        const s = data.settings;
        if (s.theme) {
          localStorage.setItem('oumusic_theme', s.theme);
          document.documentElement.setAttribute('data-theme', s.theme);
          document.getElementById('theme-dark-btn')?.classList.toggle('active', s.theme === 'dark');
          document.getElementById('theme-light-btn')?.classList.toggle('active', s.theme === 'light');
          document.getElementById('theme-gta6-btn')?.classList.toggle('active', s.theme === 'gta6');
        }
        if (s.amoled) {
          localStorage.setItem('oumusic_amoled', s.amoled);
          document.documentElement.setAttribute('data-amoled', s.amoled);
          const amoledToggle = document.getElementById('amoled-toggle');
          if (amoledToggle) amoledToggle.checked = (s.amoled === 'true');
        }
        if (s.userName) {
          localStorage.setItem('oumusic_user_name', s.userName);
          const nameEl = document.getElementById('profile-name-display');
          if (nameEl) nameEl.textContent = s.userName;
          if (typeof window.syncUserName === 'function') window.syncUserName(s.userName);
        }
        if (s.userAvatar) {
          localStorage.setItem('oumusic_user_avatar', s.userAvatar);
          if (typeof window.syncUserAvatar === 'function') window.syncUserAvatar(s.userAvatar);
        }
      }

      // 7. Statistics
      if (data.stats && typeof data.stats === 'object') {
        const secs = Number(data.stats.totalSeconds) || 0;
        const plays = Number(data.stats.totalPlays) || 0;
        if (secs > 0) localStorage.setItem('oumusic_total_seconds', String(secs));
        if (plays > 0) localStorage.setItem('oumusic_total_plays', String(plays));
        if (data.stats.monthKey && Number(data.stats.monthSeconds) > 0) {
          localStorage.setItem(`oumusic_month_seconds_${data.stats.monthKey}`, String(Number(data.stats.monthSeconds)));
        }
      }

      // Invalidate cached Year Recap data
      if (typeof window.cachedRecapData !== 'undefined') {
        window.cachedRecapData = null;
      }

      // Trigger UI updates in main app
      try {
        if (typeof window.renderPlaylistsGrid === 'function') window.renderPlaylistsGrid();
        if (typeof window.renderLikesTab === 'function') window.renderLikesTab();
        if (typeof window.updateProfileStats === 'function') window.updateProfileStats();
        if (typeof window.renderProfileHistory === 'function') window.renderProfileHistory();
      } catch (e) {}
    },

    hasDirtyChanges() {
      try {
        return localStorage.getItem(STORAGE_KEY_DIRTY) === '1';
      } catch (e) {
        return false;
      }
    },

    markDirty(dirty = true) {
      try {
        if (dirty) localStorage.setItem(STORAGE_KEY_DIRTY, '1');
        else localStorage.removeItem(STORAGE_KEY_DIRTY);
      } catch (e) {}
    },

    computeSyncDigest(data) {
      if (!data || typeof data !== 'object') return '';
      const normHistory = (Array.isArray(data.history) ? data.history : [])
        .filter((h) => h && h.trackId)
        .map((h) => ({
          trackId: h.trackId,
          durationPlayed: Math.round(Number(h.durationPlayed) || 0),
          playedAt: h.playedAt || ''
        }))
        .sort((a, b) => new Date(b.playedAt || 0) - new Date(a.playedAt || 0))
        .slice(0, 30);
      const normLikes = (Array.isArray(data.likes) ? data.likes : [])
        .map((l) => (typeof l === 'string' ? { id: l } : { id: l?.id || '', likedAt: l?.likedAt || '' }))
        .filter((l) => l.id)
        .sort((a, b) => String(a.id).localeCompare(String(b.id)));
      const normPlaylists = (Array.isArray(data.playlists) ? data.playlists : [])
        .filter((p) => p && p.id && !p._deleted && !p.deleted)
        .map((p) => ({
          id: p.id,
          name: p.name || '',
          description: p.description || '',
          coverBase64: p.coverBase64 || '',
          trackIds: Array.isArray(p.trackIds) ? p.trackIds : [],
          updatedAt: p.updatedAt || p.createdAt || ''
        }))
        .sort((a, b) => String(a.id).localeCompare(String(b.id)));
      const normManual = (Array.isArray(data.manualTracks) ? data.manualTracks : [])
        .filter((t) => t && t.id)
        .map((t) => t.id)
        .sort();
      const normBlacklist = Array.isArray(data.blacklist) ? [...data.blacklist].sort() : [];
      return JSON.stringify({
        likes: normLikes,
        playlists: normPlaylists,
        history: normHistory,
        blacklist: normBlacklist,
        manualTracks: normManual,
        settings: data.settings || {},
        stats: {
          totalSeconds: Number(data.stats?.totalSeconds || 0),
          totalPlays: Number(data.stats?.totalPlays || 0),
          monthKey: data.stats?.monthKey || '',
          monthSeconds: Number(data.stats?.monthSeconds || 0)
        }
      });
    },

    scheduleSync() {
      if (!this.isLoggedIn()) return;

      this.markDirty(true);

      if (syncDebounceTimer) {
        clearTimeout(syncDebounceTimer);
        syncDebounceTimer = null;
      }

      this.setStatusText('Изменения сохранены локально (ожидание отправки...)');

      syncDebounceTimer = setTimeout(() => {
        syncDebounceTimer = null;
        this.performSync(false);
      }, DEBOUNCE_DELAY_MS);
    },

    /**
     * Performs direct synchronization with GitHub repository.
     */
    async performSync(isManual = false, options = {}) {
      if (!this.isLoggedIn()) return;
      if (isSyncInProgress) {
        hasPendingSync = true;
        return;
      }

      const pullOnly = !!(options && options.pullOnly) && !isManual && !this.hasDirtyChanges();
      isSyncInProgress = true;
      this.setStatusText('Синхронизация с GitHub...');

      const token = this.getToken();
      const user = this.getUser();

      try {
        const fileUrl = `https://api.github.com/repos/${user.login}/${REPO_NAME}/contents/${DATA_FILE_PATH}`;

        // 1. Fetch remote content info to avoid SHA conflicts
        const checkRes = await fetch(fileUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        let currentSha = this.getFileSha();
        let remoteData = null;

        if (checkRes.ok) {
          const fileInfo = await checkRes.json();
          currentSha = fileInfo.sha || currentSha;
          try {
            const raw = base64ToUtf8(fileInfo.content || '');
            remoteData = JSON.parse(raw);
          } catch (e) {}
        }

        // 2. Collect local data
        const localData = await this.collectLocalData();
        const localDigest = this.computeSyncDigest(localData);
        const remoteDigest = remoteData ? this.computeSyncDigest(remoteData) : '';

        // 3. Smart merge with remote if remote had changes
        const finalData = remoteData ? await this.smartMerge(localData, remoteData) : localData;
        const finalDigest = this.computeSyncDigest(finalData);

        if (remoteData && localDigest !== finalDigest) {
          await this.applyDataLocally(finalData);
        }

        // 4. Push ONLY when data actually changed and push is authorized (never spam PUT on passive view/tab switch)
        const hasAnyMeaningfulData = (
          finalData.likes.length > 0 ||
          finalData.playlists.length > 0 ||
          finalData.history.length > 0 ||
          Boolean(finalData.settings?.userName) ||
          Boolean(finalData.settings?.userAvatar)
        );
        const remoteNeedsUpdate = remoteData ? (finalDigest !== remoteDigest) : hasAnyMeaningfulData;
        const canPush = isManual || this.hasDirtyChanges() || (!pullOnly && remoteNeedsUpdate);

        if (remoteNeedsUpdate && canPush) {
          const b64 = utf8ToBase64(JSON.stringify(finalData, null, 2));
          const bodyPayload = {
            message: 'Update ouMusic cloud database [skip ci]',
            content: b64
          };
          if (currentSha) {
            bodyPayload.sha = currentSha;
          }

          const putRes = await fetch(fileUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyPayload)
          });

          if (!putRes.ok) {
            const errBody = await putRes.json().catch(() => ({}));
            throw new Error(errBody.message || `HTTP ${putRes.status}`);
          }

          const putData = await putRes.json();
          if (putData.content && putData.content.sha) {
            this.setFileSha(putData.content.sha);
          }
          this.markDirty(false);
        } else if (currentSha) {
          this.setFileSha(currentSha);
          if (!remoteNeedsUpdate) this.markDirty(false);
        }

        const nowIso = new Date().toISOString();
        this.setLastSyncTime(nowIso);

        this.setStatusText(`Синхронизировано: ${this.formatTimeAgo(nowIso)}`);

        if (isManual && typeof window.showToast === 'function') {
          window.showToast('Облачная синхронизация завершена успешно');
        }
      } catch (err) {
        console.error('[CloudSync] Sync failed:', err);
        this.setStatusText('Ошибка синхронизации (повтор при подключении)');
        if (isManual && typeof window.showToast === 'function') {
          window.showToast('Ошибка синхронизации: ' + err.message);
        }
      } finally {
        isSyncInProgress = false;
        if (hasPendingSync) {
          hasPendingSync = false;
          if (this.hasDirtyChanges()) {
            this.scheduleSync();
          }
        }
      }
    },

    /**
     * Log out from GitHub cloud account.
     */
    logout() {
      this.setToken('');
      this.setUser(null);
      this.setFileSha('');
      this.setLastSyncTime('');
      this.updateUI();

      if (typeof window.showToast === 'function') {
        window.showToast('Вы вышли из аккаунта GitHub');
      }
    },

    /**
     * Formats ISO timestamp to human friendly Russian string.
     */
    formatTimeAgo(isoStr) {
      if (!isoStr) return 'никогда';
      try {
        const d = new Date(isoStr);
        const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
        if (diffSec < 45) return 'только что';
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)} мин. назад`;
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        return 'недавно';
      }
    },

    setStatusText(text) {
      const els = document.querySelectorAll('.gh-sync-status-text, #gh-sync-time');
      els.forEach((el) => {
        el.textContent = text;
      });
      const badges = document.querySelectorAll('#gh-sync-badge-status');
      badges.forEach((b) => {
        if (this.isLoggedIn()) {
          b.textContent = 'Подключено';
          b.style.background = 'rgba(168, 85, 247, 0.2)';
          b.style.color = 'var(--md-sys-color-primary)';
        } else {
          b.textContent = 'Не подключено';
          b.style.background = 'rgba(255, 255, 255, 0.08)';
          b.style.color = 'var(--md-sys-color-outline)';
        }
      });
    },

    /**
     * Synchronizes UI components in Settings and Profile.
     */
    updateUI() {
      const loggedIn = this.isLoggedIn();
      const user = this.getUser();

      // Guest / User view toggles
      document.querySelectorAll('.gh-auth-guest-view').forEach((el) => {
        el.style.display = loggedIn ? 'none' : 'flex';
      });
      document.querySelectorAll('.gh-auth-user-view').forEach((el) => {
        el.style.display = loggedIn ? 'flex' : 'none';
      });

      if (loggedIn && user) {
        document.querySelectorAll('.gh-user-avatar-img').forEach((img) => {
          if (user.avatar_url) img.src = user.avatar_url;
        });
        document.querySelectorAll('.gh-user-login-text').forEach((txt) => {
          txt.textContent = `@${user.login}`;
        });
        const lastSync = this.getLastSyncTime();
        this.setStatusText(`Синхронизировано: ${this.formatTimeAgo(lastSync)}`);
      } else {
        this.setStatusText('Не подключено');
      }
    },

    /**
     * Renders pixel-crisp QR code on HTML Canvas.
     */
    renderQRCode(canvas, text) {
      if (!text) return false;

      const qrcodeFn = (typeof window !== 'undefined' && window.qrcode) || (typeof qrcode !== 'undefined' ? qrcode : null);
      if (typeof qrcodeFn !== 'function') {
        console.error('[CloudSync] qrcode generator function is not available');
        return false;
      }

      try {
        const qr = qrcodeFn(0, 'M');
        qr.addData(String(text).trim());
        qr.make();

        const count = qr.getModuleCount();
        const size = 260;
        const cellSize = Math.floor(size / count);
        const actualSize = cellSize * count;
        const margin = Math.floor((size - actualSize) / 2);

        let canvasRendered = false;
        if (canvas && typeof canvas.getContext === 'function') {
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, size, size);

            ctx.fillStyle = '#000000';
            for (let row = 0; row < count; row++) {
              for (let col = 0; col < count; col++) {
                if (qr.isDark(row, col)) {
                  ctx.fillRect(margin + col * cellSize, margin + row * cellSize, cellSize, cellSize);
                }
              }
            }
            canvas.style.display = 'block';
            canvasRendered = true;
          }
        }

        // Image fallback (ensures QR is visible even if canvas is hidden or blocked)
        const imgEl = document.getElementById('qr-transfer-img');
        if (imgEl) {
          try {
            const dataUrl = qr.createDataURL(4, 6);
            imgEl.src = dataUrl;
            if (!canvasRendered) {
              imgEl.style.display = 'block';
              if (canvas) canvas.style.display = 'none';
            }
          } catch (e) {}
        }

        return true;
      } catch (err) {
        console.error('[CloudSync] Failed to render QR code:', err);
        return false;
      }
    },

    /**
     * Decodes QR code from Canvas image data using BarcodeDetector or fallback jsQR.
     */
    async decodeCanvas(canvas) {
      if (!canvas) return null;

      // 1. Try native hardware-accelerated BarcodeDetector
      if (typeof window.BarcodeDetector !== 'undefined') {
        try {
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await detector.detect(canvas);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            return barcodes[0].rawValue.trim();
          }
        } catch (e) {}
      }

      // 2. Pure JS fallback: jsQR
      if (typeof window.jsQR === 'function') {
        try {
          const ctx = canvas.getContext('2d');
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const res = window.jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: 'dontInvert'
          });
          if (res && res.data) {
            return res.data.trim();
          }
        } catch (e) {}
      }

      return null;
    },

    /**
     * Parses token from QR payload.
     * Supports raw ghp_ token or JSON { app: 'ouMusic', token: '...' }.
     */
    parseTokenFromQR(raw) {
      if (!raw) return null;
      const str = String(raw).trim();
      if (str.startsWith('ghp_') || str.startsWith('github_pat_')) {
        return str;
      }
      try {
        const obj = JSON.parse(str);
        if (obj && obj.token) {
          return String(obj.token).trim();
        }
      } catch (e) {}
      return null;
    }
  };

  // Auto-sync (pull-only unless local dirty changes pending) on startup if logged in
  function triggerStartupSync() {
    if (OUMusicCloudSync.isLoggedIn()) {
      setTimeout(() => {
        OUMusicCloudSync.performSync(false, { pullOnly: !OUMusicCloudSync.hasDirtyChanges() });
      }, 1200);
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    triggerStartupSync();
  } else {
    window.addEventListener('DOMContentLoaded', triggerStartupSync);
  }

  // Only flush sync when returning online if significant dirty changes exist
  window.addEventListener('online', () => {
    if (OUMusicCloudSync.isLoggedIn() && OUMusicCloudSync.hasDirtyChanges()) {
      OUMusicCloudSync.scheduleSync();
    }
  });

  window.OUMusicCloudSync = OUMusicCloudSync;
})(window);
