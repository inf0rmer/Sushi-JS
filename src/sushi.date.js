/**
 * Sushi Date
 *
 * @module Sushi
 */
/*global Sushi:true, define:true*/
define('sushi.date',
    [
    ],
    
	/**
	 * Sushi Date - Date Handling functions
	 *
	 * @namespace Sushi
	 * @class date
	 */
    function() {
    	Sushi.namespace('date');
    	
    	var ext = {},
    		locale = "en-GB";
    	
		ext.util = {};
		ext.util.xPad = function (x, pad, r) {
			if (typeof (r) == "undefined") {
				r = 10
			}
			for (; parseInt(x, 10) < r && r > 1; r /= 10) {
				x = pad.toString() + x
			}
			return x.toString()
		};
		
		if (document.getElementsByTagName("html") && document.getElementsByTagName("html")[0].lang) {
			locale = document.getElementsByTagName("html")[0].lang
		}
		
		ext.locales = {};
		ext.locales.en = {
			a: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
			A: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
			b: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
			B: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
			c: "%a %d %b %Y %T %Z",
			p: ["AM", "PM"],
			P: ["am", "pm"],
			x: "%d/%m/%y",
			X: "%T"
		};
		ext.locales["en-US"] = ext.locales.en;
		ext.locales["en-US"].c = "%a %d %b %Y %r %Z";
		ext.locales["en-US"].x = "%D";
		ext.locales["en-US"].X = "%r";
		ext.locales["en-GB"] = ext.locales.en;
		ext.locales["en-AU"] = ext.locales["en-GB"];
		ext.formats = {
			a: function (d) {
				return ext.locales[d.locale].a[d.getDay()]
			},
			A: function (d) {
				return ext.locales[d.locale].A[d.getDay()]
			},
			b: function (d) {
				return ext.locales[d.locale].b[d.getMonth()]
			},
			B: function (d) {
				return ext.locales[d.locale].B[d.getMonth()]
			},
			c: "toLocaleString",
			C: function (d) {
				return ext.util.xPad(parseInt(d.getFullYear() / 100, 10), 0)
			},
			d: ["getDate", "0"],
			e: ["getDate", " "],
			g: function (d) {
				return ext.util.xPad(parseInt(ext.util.G(d) / 100, 10), 0)
			},
			G: function (d) {
				var y = d.getFullYear();
				var V = parseInt(ext.formats.V(d), 10);
				var W = parseInt(ext.formats.W(d), 10);
				if (W > V) {
					y++
				} else {
					if (W === 0 && V >= 52) {
						y--
					}
				}
				return y
			},
			H: ["getHours", "0"],
			I: function (d) {
				var I = d.getHours() % 12;
				return ext.util.xPad(I === 0 ? 12 : I, 0)
			},
			j: function (d) {
				var ms = d - new Date("" + d.getFullYear() + "/1/1 GMT");
				ms += d.getTimezoneOffset() * 60000;
				var doy = parseInt(ms / 60000 / 60 / 24, 10) + 1;
				return ext.util.xPad(doy, 0, 100)
			},
			m: function (d) {
				return ext.util.xPad(d.getMonth() + 1, 0)
			},
			M: ["getMinutes", "0"],
			p: function (d) {
				return ext.locales[d.locale].p[d.getHours() >= 12 ? 1 : 0]
			},
			P: function (d) {
				return ext.locales[d.locale].P[d.getHours() >= 12 ? 1 : 0]
			},
			S: ["getSeconds", "0"],
			u: function (d) {
				var dow = d.getDay();
				return dow === 0 ? 7 : dow
			},
			U: function (d) {
				var doy = parseInt(ext.formats.j(d), 10);
				var rdow = 6 - d.getDay();
				var woy = parseInt((doy + rdow) / 7, 10);
				return ext.util.xPad(woy, 0)
			},
			V: function (d) {
				var woy = parseInt(ext.formats.W(d), 10);
				var dow1_1 = (new Date("" + d.getFullYear() + "/1/1")).getDay();
				var idow = woy + (dow1_1 > 4 || dow1_1 <= 1 ? 0 : 1);
				if (idow == 53 && (new Date("" + d.getFullYear() + "/12/31")).getDay() < 4) {
					idow = 1
				} else {
					if (idow === 0) {
						idow = ext.formats.V(new Date("" + (d.getFullYear() - 1) + "/12/31"))
					}
				}
				return ext.util.xPad(idow, 0)
			},
			w: "getDay",
			W: function (d) {
				var doy = parseInt(ext.formats.j(d), 10);
				var rdow = 7 - ext.formats.u(d);
				var woy = parseInt((doy + rdow) / 7, 10);
				return ext.util.xPad(woy, 0, 10)
			},
			y: function (d) {
				return ext.util.xPad(d.getFullYear() % 100, 0)
			},
			Y: "getFullYear",
			z: function (d) {
				var o = d.getTimezoneOffset();
				var H = ext.util.xPad(parseInt(Math.abs(o / 60), 10), 0);
				var M = ext.util.xPad(o % 60, 0);
				return (o > 0 ? "-" : "+") + H + M
			},
			Z: function (d) {
				return d.toString().replace(/^.*\(([^)]+)\)$/, "$1")
			},
			"%": function (d) {
				return "%"
			}
		};
		ext.aggregates = {
			c: "locale",
			D: "%m/%d/%y",
			h: "%b",
			n: "\n",
			r: "%I:%M:%S %p",
			R: "%H:%M",
			t: "\t",
			T: "%H:%M:%S",
			x: "locale",
			X: "locale"
		};
		ext.aggregates.z = ext.formats.z(new Date());
		ext.aggregates.Z = ext.formats.Z(new Date());
		ext.unsupported = {};
		
		Sushi.extend(Sushi.date, {
			strftime: function (d, fmt) {
				if (!(locale in ext.locales)) {
					if (locale.replace(/-[a-zA-Z]+$/, "") in ext.locales) {
						locale = locale.replace(/-[a-zA-Z]+$/, "")
					} else {
						locale = "en-GB"
					}
				}
				while (fmt.match(/%[cDhnrRtTxXzZ]/)) {
					fmt = fmt.replace(/%([cDhnrRtTxXzZ])/g, function (m0, m1) {
						var f = ext.aggregates[m1];
						return (f == "locale" ? ext.locales[d.locale][m1] : f)
					})
				}
				var str = fmt.replace(/%([aAbBCdegGHIjmMpPSuUVwWyY%])/g, function (m0, m1) {
					var f = ext.formats[m1];
					if (typeof (f) == "string") {
						return d[f]()
					} else {
						if (typeof (f) == "function") {
							return f.call(d, d)
						} else {
							if (typeof (f) == "object" && typeof (f[0]) == "string") {
								return ext.util.xPad(d[f[0]](), f[1])
							} else {
								return m1
							}
						}
					}
				});
				d = null;
				return str
			},
			
			setLocale: function(newLocale) {
				if (newLocale in ext.locales) locale = newLocale;
			}
		});
		
		return Sushi.date;
    }
);
