(function(e){function n(n){for(var r,a,s=n[0],c=n[1],l=n[2],d=0,h=[];d<s.length;d++)a=s[d],Object.prototype.hasOwnProperty.call(i,a)&&i[a]&&h.push(i[a][0]),i[a]=0;for(r in c)Object.prototype.hasOwnProperty.call(c,r)&&(e[r]=c[r]);u&&u(n);while(h.length)h.shift()();return o.push.apply(o,l||[]),t()}function t(){for(var e,n=0;n<o.length;n++){for(var t=o[n],r=!0,s=1;s<t.length;s++){var c=t[s];0!==i[c]&&(r=!1)}r&&(o.splice(n--,1),e=a(a.s=t[0]))}return e}var r={},i={app:0},o=[];function a(n){if(r[n])return r[n].exports;var t=r[n]={i:n,l:!1,exports:{}};return e[n].call(t.exports,t,t.exports,a),t.l=!0,t.exports}a.m=e,a.c=r,a.d=function(e,n,t){a.o(e,n)||Object.defineProperty(e,n,{enumerable:!0,get:t})},a.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},a.t=function(e,n){if(1&n&&(e=a(e)),8&n)return e;if(4&n&&"object"===typeof e&&e&&e.__esModule)return e;var t=Object.create(null);if(a.r(t),Object.defineProperty(t,"default",{enumerable:!0,value:e}),2&n&&"string"!=typeof e)for(var r in e)a.d(t,r,function(n){return e[n]}.bind(null,r));return t},a.n=function(e){var n=e&&e.__esModule?function(){return e["default"]}:function(){return e};return a.d(n,"a",n),n},a.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)},a.p="/";var s=window["webpackJsonp"]=window["webpackJsonp"]||[],c=s.push.bind(s);s.push=n,s=s.slice();for(var l=0;l<s.length;l++)n(s[l]);var u=c;o.push([0,"chunk-vendors"]),t()})({0:function(e,n,t){e.exports=t("56d7")},"56d7":function(e,n,t){"use strict";t.r(n);t("e260"),t("e6cf"),t("cca6"),t("a79d");var r=t("7a23"),i={id:"webgl-container"};function o(e,n,t,o,a,s){return Object(r["c"])(),Object(r["b"])("div",i)}var a=t("d4ec"),s=t("bee2"),c=t("5a89"),l=t("4721");t("d3b7"),t("25f0"),t("e642");function u(e,n){return e+Math.random()*(n-e)}function d(){var e=Math.floor(16777216*Math.random()).toString(16);while(e.length<6)e="0"+e;return"#"+e}var h=window.innerWidth,f=Math.max(window.innerHeight-130,200),p=function(){function e(){Object(a["a"])(this,e),this.initScene(),this.initCamera(),this.initLight(),this.initRenderer(),this.initObject(),this.controls=new l["a"](this.camera,this.renderer.domElement),this.clock=new c["c"],this.render()}return Object(s["a"])(e,[{key:"initScene",value:function(){this.scene=new c["u"]}},{key:"initRenderer",value:function(){this.renderer=new c["B"]({antialias:!0,alpha:!0}),this.renderer.setPixelRatio(window.devicePixelRatio),this.renderer.setClearColor(0,1),this.renderer.setSize(h,f),document.getElementById("webgl-container").appendChild(this.renderer.domElement)}},{key:"initCamera",value:function(){this.camera=new c["p"](45,h/f,.1,1e6),this.camera.position.set(-132,-757,-767),this.camera.lookAt(new c["A"](0,0,0)),this.scene.add(this.camera)}},{key:"initLight",value:function(){this.light=new c["q"](16777215,.8),this.light.position.set(100,100,100),this.scene.add(this.light)}},{key:"render",value:function(){this.renderer.render(this.scene,this.camera),requestAnimationFrame(this.render.bind(this))}},{key:"initDevHelpers",value:function(){this.axesHelper=new c["a"](200),this.scene.add(this.axesHelper)}},{key:"initObject",value:function(){for(var e=1;e<100;e++){var n=new c["w"](100,50,50),t=new c["v"]({uniforms:{baseColor:{type:"vec3",value:new c["d"](d())}},transparent:!0,vertexShader:"\n          varying float intensity;\n          void main() {\n            vec3 normalCamera = normalize(normalMatrix * cameraPosition);\n            vec3 viewNormal = normalize(normalMatrix * normal);\n            intensity = 1.0 - dot(viewNormal, normalCamera);\n            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n          }\n        ",fragmentShader:"\n          uniform vec3 baseColor;\n          varying float intensity;\n          void main() {\n            gl_FragColor = vec4(intensity * baseColor, 0.9);\n          }\n        "}),r=new c["n"](n,t);r.position.set(u(100*e,300*e),u(100*e,300*e),u(100*e,300*e)),this.scene.add(r)}}}]),e}(),v={components:{},mounted:function(){new p}},m=t("d959"),w=t.n(m);const b=w()(v,[["render",o]]);var y=b;Object(r["a"])(y).mount("#app")}});
//# sourceMappingURL=app.ae8bff2f.js.map