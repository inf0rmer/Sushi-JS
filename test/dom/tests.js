require.config({
	baseUrl: '../../src',
	waitSeconds: 15
});

require(['vendors/domReady!'], function(doc) {
	// custom pseudo just for tests
	Sushi.qwery.pseudos.humanoid = function(e, v) { return Sushi.qwery.is(e, 'li:contains(human)') || Sushi.qwery.is(e, 'ol:contains(human)') }
	
	module('Sushi');
	test('Sushi is available', 1, function() {
		ok(Sushi.qwery, 'Sushi.qwery is defined');
	});
	
	module('Contexts');
	test('should be able to pass optional context', 2, function () {
		equals(Sushi('.a').length, 3, 'no context found 3 elements (.a)');
		equals(Sushi('.a', Sushi('#boosh')).length, 2, 'context found 2 elements (#boosh .a)');
	});
	
	test('should be able to pass string as context', 5, function() {
		equals(Sushi('.a', '#boosh').length, 2, 'context found 2 elements(.a, #boosh)');
		equals(Sushi('.a', '.a').length, 0, 'context found 0 elements(.a, .a)');
		equals(Sushi('.a', '.b').length, 1, 'context found 1 elements(.a, .b)');
		equals(Sushi('.a', '#boosh .b').length, 1, 'context found 1 elements(.a, #boosh .b)');
		equals(Sushi('.b', '#boosh .b').length, 0, 'context found 0 elements(.b, #boosh .b)');
	});
	
	test('should be able to pass qwery result as context', 5, function() {
		equals(Sushi('.a', Sushi('#boosh')).length, 2, 'context found 2 elements(.a, #boosh)');
		equals(Sushi('.a', Sushi('.a')).length, 0, 'context found 0 elements(.a, .a)');
		equals(Sushi('.a', Sushi('.b')).length, 1, 'context found 1 elements(.a, .b)');
		equals(Sushi('.a', Sushi('#boosh .b')).length, 1, 'context found 1 elements(.a, #boosh .b)');
		equals(Sushi('.b', Sushi('#boosh .b')).length, 0, 'context found 0 elements(.b, #boosh .b)');
	});
	
	test('should not return duplicates from combinators', 2, function () {
		equals(Sushi('#boosh,#boosh').length, 1, 'two booshes dont make a thing go right');
		equals(Sushi('#boosh,.apples,#boosh').length, 1, 'two booshes and an apple dont make a thing go right');
	});
	
	test('byId sub-queries within context', 6, function() {
		equals(Sushi('#booshTest', Sushi('#boosh')).length, 1, 'found "#id #id"')
		equals(Sushi('.a.b #booshTest', Sushi('#boosh')).length, 1, 'found ".class.class #id"')
		equals(Sushi('.a>#booshTest', Sushi('#boosh')).length, 1, 'found ".class>#id"')
		equals(Sushi('>.a>#booshTest', Sushi('#boosh')).length, 1, 'found ">.class>#id"')
		equals(Sushi('#boosh', Sushi('#booshTest')).length, 0, 'shouldn\'t find #boosh (ancestor) within #booshTest (descendent)')
		equals(Sushi('#boosh', Sushi('#lonelyBoosh')).length, 0, 'shouldn\'t find #boosh within #lonelyBoosh (unrelated)')
	});
	
	module('CSS 1');
	test('get element by id', 2, function () {
		var result = Sushi('#boosh');
		ok(!!result[0], 'found element with id=boosh');
		ok(!!Sushi('h1')[0], 'found 1 h1');
	});
	
	test('byId sub-queries', 4, function() {
		ok(Sushi('#boosh #booshTest').length == 1, 'found "#id #id"')
		ok(Sushi('.a.b #booshTest').length == 1, 'found ".class.class #id"')
		ok(Sushi('#boosh>.a>#booshTest').length == 1, 'found "#id>.class>#id"')
		ok(Sushi('.a>#booshTest').length == 1, 'found ".class>#id"')
	})
	
	test('get elements by class', 6, function () {
		ok(Sushi('#boosh .a').length == 2, 'found two elements');
		ok(!!Sushi('#boosh div.a')[0], 'found one element');
		ok(Sushi('#boosh div').length == 2, 'found two {div} elements');
		ok(!!Sushi('#boosh span')[0], 'found one {span} element');
		ok(!!Sushi('#boosh div div')[0], 'found a single div');
		ok(Sushi('a.odd').length == 1, 'found single a');
	});
	
	test('combos', 1, function () {
		ok(Sushi('#boosh div,#boosh span').length == 3, 'found 2 divs and 1 span');
	});
	
	test('class with dashes', 1, function() {
		ok(Sushi('.class-with-dashes').length == 1, 'found something');
	});
	
	test('should ignore comment nodes', 1, function() {
		ok(Sushi('#boosh *').length === 4, 'found only 4 elements under #boosh')
	});
	
	test('deep messy relationships', 6, function() {
		// these are mostly characterised by a combination of tight relationships and loose relationships
		// on the right side of the query it's easy to find matches but they tighten up quickly as you
		// go to the left
		// they are useful for making sure the dom crawler doesn't stop short or over-extend as it works
		// up the tree the crawl needs to be comprehensive
		ok(Sushi('div#fixtures > div a').length == 5, 'found four results for "div#fixtures > div a"')
		ok(Sushi('.direct-descend > .direct-descend .lvl2').length == 1, 'found one result for ".direct-descend > .direct-descend .lvl2"')
		ok(Sushi('.direct-descend > .direct-descend div').length == 1, 'found one result for ".direct-descend > .direct-descend div"')
		ok(Sushi('.direct-descend > .direct-descend div').length == 1, 'found one result for ".direct-descend > .direct-descend div"')
		ok(Sushi('div#fixtures div ~ a div').length == 0, 'found no results for odd query')
		ok(Sushi('.direct-descend > .direct-descend > .direct-descend ~ .lvl2').length == 0, 'found no results for another odd query')
	});
	
	module('CSS 2');
	test('get elements by attribute', 4, function () {
		var wanted = Sushi('#boosh div[test]')[0];
		var expected = document.getElementById('booshTest');
		ok(wanted == expected, 'found attribute');
		ok(Sushi('#boosh div[test=fg]')[0] == expected, 'found attribute with value');
		ok(Sushi('em[rel~="copyright"]').length == 1, 'found em[rel~="copyright"]');
		ok(Sushi('em[nopass~="copyright"]').length == 0, 'found em[nopass~="copyright"]');
	});
	
	test('should not throw error by attribute selector', 1, function () {
		ok(Sushi('[foo^="bar"]').length === 1, 'found 1 element');
	});
	
	test('crazy town', 1, function () {
		var el = document.getElementById('attr-test3');
		ok(Sushi('div#attr-test3.found.you[title="whatup duders"]')[0] == el, 'found the right element');
	});
	
	module('CSS 2 identification');
	// cases that we should be able to pass through to native non-CSS3 qSA where present (IE8)
	// we get to ignore grouping here since selectors are split up for this case anyway
	// we also get to work with normalized selectors
	// this regex must be kept in sync with the one in src/qwery.js for the test to make sense
	var css2 = /^(([\w\-]*[#\.]?[\w\-]+|\*)?(\[[\w\-]+([\~\|]?=['"][ \w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^]+["'])?\])?(\:(link|visited|active|hover))?([\s>+~\.,]|(?:$)))+$/
		, css2Selectors = [
			  '*',
			, 'DIV',
			, 'e1 e2',
			, 'parent>child'
			, 'parent+child'
			, 'parent~child' // CSS3 but IE8 supports ~
			, '#id'
			, 'el#id'
			, 'el #id'
			, 'el>#id'
			, '#id>#id2'
			, '.class'
			, 'div.class'
			, '#id.class'
			, 'element.with.multiple.classes>bam'
			//, 'el:first-child' -> IE8 buggy, don't do native
			, 'a:link'
			, 'a#id:link'
			, '.class:visited'
			, '#boo:active'
			, 'div.class:hover'
			//, '*:focus' -> IE8 doesn't support, don't do native
			, 'hoo[foo]'
			, '#hah[boo="moo"]'
			, '.claz[attrib~=\'nooooooo!\']'
			, 'ele[prop|="huh?"]'
			, '.direct-descend>.direct-descend>.direct-descend'
			, '.direct-descend>.direct-descend>.direct-descend~.lvl2'
		  ]
		, nonCSS2Selectors = [
			  'p:empty'
			, 'hoo:enabled'
			, 'haa:disabled'
			, '#bing:checked'
			, '*:first-of-type'
			, '*:last-of-type'
			, '.class:last-child'
			, 'yes:not'
			, 'p:nth-child(2n+1)'
			, 'p:nth-last-child(1n+2)'
			, 'p:nth-last-of-type(3n+3)'
			, 'p:nth-of-type(4n+2)'
			, '*:only-child'
			, '*:only-of-type'
			, 'p#id:root'
			, '#gak::selection'
			, 'body:target'
			// CSS2 buggy
			, 'el:first-child'
			, '*:focus'
		  ]
	
	test('CSS2 selectors', css2Selectors.length, function() {
		for (var i = 0; i < css2Selectors.length; i++) {
			ok(css2.test(css2Selectors[i]), 'matched ' + css2Selectors[i])
		}
	})
	
	test('CSS2 selectors grouped', 1, function() {
		ok(css2.test(css2Selectors.join(',')), 'matched grouped CSS2 selectors')
	})
	
	test('non-CSS2 selectors', nonCSS2Selectors.length, function() {
		for (var i = 0; i < nonCSS2Selectors.length; i++) {
			ok(!css2.test(nonCSS2Selectors[i]), 'did not match ' + nonCSS2Selectors[i])
		}
	})
	
	module('Attribute Selectors');
	/* CSS 2 SPEC */
	test('[attr]', 1, function () {
		var expected = document.getElementById('attr-test-1');
		ok(Sushi('#attributes div[unique-test]')[0] == expected, 'found attribute with [attr]');
	});
	
	test('[attr=val]', 3, function () {
		var expected = document.getElementById('attr-test-2');
		ok(Sushi('#attributes div[test="two-foo"]')[0] == expected, 'found attribute with =');
		ok(Sushi("#attributes div[test='two-foo']")[0] == expected, 'found attribute with =');
		ok(Sushi('#attributes div[test=two-foo]')[0] == expected, 'found attribute with =');
	});
	
	test('[attr~=val]', 1, function () {
		var expected = document.getElementById('attr-test-3');
		ok(Sushi('#attributes div[test~=three]')[0] == expected, 'found attribute with ~=');
	});
	
	test('[attr|=val]', 2, function () {
		var expected = document.getElementById('attr-test-2');
		ok(Sushi('#attributes div[test|="two-foo"]')[0] == expected, 'found attribute with |=');
		ok(Sushi('#attributes div[test|=two]')[0] == expected, 'found attribute with |=');
	});
	
	test('[href=#x] special case', 1, function () {
		var expected = document.getElementById('attr-test-4');
		ok(Sushi('#attributes a[href="#aname"]')[0] == expected, 'found attribute with href=#x');
	});
	
	/* CSS 3 SPEC */
	
	test('[attr^=val]', 1, function () {
		var expected = document.getElementById('attr-test-2');
		ok(Sushi('#attributes div[test^=two]')[0] == expected, 'found attribute with ^=');
	});
	
	test('[attr$=val]', 1, function () {
		var expected = document.getElementById('attr-test-2');
		ok(Sushi('#attributes div[test$=foo]')[0] == expected, 'found attribute with $=');
	});
	
	test('[attr*=val]', 1, function () {
		var expected = document.getElementById('attr-test-3');
		ok(Sushi('#attributes div[test*=hree]')[0] == expected, 'found attribute with *=');
	});
	
	test('direct descendants', 2, function () {
		ok(Sushi('#direct-descend > .direct-descend').length == 2, 'found two direct descendents');
		ok(Sushi('#direct-descend > .direct-descend > .lvl2').length == 3, 'found three second-level direct descendents');
	});
	
	test('sibling elements', 17, function () {
		equals(Sushi('#sibling-selector ~ .sibling-selector').length, 2, 'found two siblings')
		equals(Sushi('#sibling-selector ~ div.sibling-selector').length, 2, 'found two siblings')
		equals(Sushi('#sibling-selector + div.sibling-selector').length, 1, 'found one sibling')
		equals(Sushi('#sibling-selector + .sibling-selector').length, 1, 'found one sibling')
	
		equals(Sushi('.parent .oldest ~ .sibling').length, 4, 'found four younger siblings')
		equals(Sushi('.parent .middle ~ .sibling').length, 2, 'found two younger siblings')
		equals(Sushi('.parent .middle ~ h4').length, 1, 'found next sibling by tag')
		equals(Sushi('.parent .middle ~ h4.younger').length, 1, 'found next sibling by tag and class')
		equals(Sushi('.parent .middle ~ h3').length, 0, 'an element can\'t be its own sibling')
		equals(Sushi('.parent .middle ~ h2').length, 0, 'didn\'t find an older sibling')
		equals(Sushi('.parent .youngest ~ .sibling').length, 0, 'found no younger siblings')
	
		equals(Sushi('.parent .oldest + .sibling').length, 1, 'found next sibling')
		equals(Sushi('.parent .middle + .sibling').length, 1, 'found next sibling')
		equals(Sushi('.parent .middle + h4').length, 1, 'found next sibling by tag')
		equals(Sushi('.parent .middle + h3').length, 0, 'an element can\'t be its own sibling')
		equals(Sushi('.parent .middle + h2').length, 0, 'didn\'t find an older sibling')
		equals(Sushi('.parent .youngest + .sibling').length, 0, 'found no younger siblings')
	});
	
	module('Uniq');
	test("duplicates aren't found in arrays", 2, function () {
		equals(Sushi.qwery.uniq(['a', 'b', 'c', 'd', 'e', 'a', 'b', 'c', 'd', 'e']).length, 5, 'result should be a, b, c, d, e')
		equals(Sushi.qwery.uniq(['a', 'b', 'c', 'c', 'c']).length, 3, 'result should be a, b, c')
	})
	
	module('Element-context queries');
	test('relationship-first queries', 5, function() {
		var pass = false
		try { pass = Sushi('> .direct-descend', Sushi('#direct-descend')).length == 2 } catch (e) { }
		ok(pass, 'found two direct descendents using > first');
	
		pass = false
		try { pass = Sushi('~ .sibling-selector', Sushi('#sibling-selector')).length == 2 } catch (e) { }
		ok(pass, 'found two siblings with ~ first')
	
		pass = false
		try { pass = Sushi('+ .sibling-selector', Sushi('#sibling-selector')).length == 1 } catch (e) { }
		ok(pass, 'found one sibling with + first')
	
		pass = false
		var ctx = Sushi('.idless')[0]
		try { pass = Sushi('> .tokens a', ctx).length == 1 } catch (e) { }
		ok(pass, 'found one sibling from a root with no id')
		ok(!ctx.getAttribute('id'), 'root element used for selection still has no id')
	})
	
	// should be able to query on an element that hasn't been inserted into the dom
	var frag = document.createElement('div')
	frag.innerHTML = '<div class="d i v"><p id="oooo"><em></em><em id="emem"></em></p></div><p id="sep"><div class="a"><span></span></div></p>'
	
	test('detached fragments', 2, function() {
		ok(Sushi('.a span', frag).length == 1, 'should find child elements of fragment')
		ok(Sushi('> div p em', frag).length == 2, 'should find child elements of fragment, relationship first')
	})
	
	test('byId sub-queries within detached fragment', 6, function () {
		ok(Sushi('#emem', frag).length == 1, 'found "#id" in fragment')
		ok(Sushi('.d.i #emem', frag).length == 1, 'found ".class.class #id" in fragment')
		ok(Sushi('.d #oooo #emem', frag).length == 1, 'found ".class #id #id" in fragment')
		ok(Sushi('> div #oooo', frag).length == 1, 'found "> .class #id" in fragment')
		ok(!Sushi('#oooo', Sushi('#emem', frag)).length, 'shouldn\'t find #oooo (ancestor) within #emem (descendent)')
		ok(!Sushi('#sep', Sushi('#emem', frag)).length, 'shouldn\'t find #sep within #emem (unrelated)')
	})
	
	test('exclude self in match', 1, function() {
		ok(Sushi('.order-matters', Sushi('#order-matters')).length == 4, 'should not include self in element-context queries')
	});
	
	// because form's have .length
	test('forms can be used as contexts', 1, function() {
		ok(Sushi('*', Sushi('form')[0]).length === 3, 'found 3 elements under &lt;form&gt;')
	})
	
	
	module('Tokenizer');
	test('should not get weird tokens', 5, function () {
		ok(Sushi('div .tokens[title="one"]')[0] == document.getElementById('token-one'), 'found div .tokens[title="one"]');
		ok(Sushi('div .tokens[title="one two"]')[0] == document.getElementById('token-two'), 'found div .tokens[title="one two"]');
		ok(Sushi('div .tokens[title="one two three #%"]')[0] == document.getElementById('token-three'), 'found div .tokens[title="one two three #%"]');
		ok(Sushi("div .tokens[title='one two three #%'] a")[0] == document.getElementById('token-four'), 'found div .tokens[title=\'one two three #%\'] a');
		ok(Sushi('div .tokens[title="one two three #%"] a[href$=foo] div')[0] == document.getElementById('token-five'), 'found div .tokens[title="one two three #%"] a[href=foo] div');
	});
	
	
	module('Interesting Syntaxes');
	test('should parse bad selectors', 1, function () {
		ok(Sushi('#spaced-tokens    p    em    a').length, 'found element with funny tokens')
	});
	
	
	module('Order Matters');
	function tag(el) {
		return el.tagName.toLowerCase();
	}
	
	// <div id="order-matters">
	//   <p class="order-matters"></p>
	//   <a class="order-matters">
	//     <em class="order-matters"></em><b class="order-matters"></b>
	//   </a>
	// </div>
	
	test('the order of elements return matters', 4, function () {
		var els = Sushi('#order-matters .order-matters');
		ok(tag(els[0]) == 'p', 'first element matched is a {p} tag');
		ok(tag(els[1]) == 'a', 'first element matched is a {a} tag');
		ok(tag(els[2]) == 'em', 'first element matched is a {em} tag');
		ok(tag(els[3]) == 'b', 'first element matched is a {b} tag');
	});
	
	
	module('Pseudo Selectors');
	test(':contains', 4, function() {
		ok(Sushi('li:contains(humans)').length == 1, 'found by "element:contains(text)"')
		ok(Sushi(':contains(humans)').length == 5, 'found by ":contains(text)", including all ancestors')
		// * is an important case, can cause weird errors
		ok(Sushi('*:contains(humans)').length == 5, 'found by "*:contains(text)", including all ancestors')
		ok(Sushi('ol:contains(humans)').length == 1, 'found by "ancestor:contains(text)"')
	})
	
	test(':not', 1, function() {
		ok(Sushi('.odd:not(div)').length == 1, 'found one .odd :not an &lt;a&gt;')
	})
	
	test(':first-child', 2, function () {
		ok(Sushi('#pseudos div:first-child')[0] == document.getElementById('pseudos').getElementsByTagName('*')[0], 'found first child')
		ok(Sushi('#pseudos div:first-child').length == 1, 'found only 1')
	});
	
	test(':last-child', 2, function () {
		var all = document.getElementById('pseudos').getElementsByTagName('div');
		ok(Sushi('#pseudos div:last-child')[0] == all[all.length - 1], 'found last child')
		ok(Sushi('#pseudos div:last-child').length == 1, 'found only 1')
	});
	
	test('ol > li[attr="boosh"]:last-child', 2, function () {
		var expected = document.getElementById('attr-child-boosh');
		ok(Sushi('ol > li[attr="boosh"]:last-child').length == 1, 'only 1 element found');
		ok(Sushi('ol > li[attr="boosh"]:last-child')[0] == expected, 'found correct element');
	});
	
	test(':nth-child(odd|even|x)', 4, function () {
		var second = document.getElementById('pseudos').getElementsByTagName('div')[1];
		ok(Sushi('#pseudos :nth-child(odd)').length == 4, 'found 4 odd elements');
		ok(Sushi('#pseudos div:nth-child(odd)').length == 3, 'found 3 odd elements with div tag');
		ok(Sushi('#pseudos div:nth-child(even)').length == 3, 'found 3 even elements with div tag');
		ok(Sushi('#pseudos div:nth-child(2)')[0] == second, 'found 2nd nth-child of pseudos');
	});
	
	test(':nth-child(expr)', 6, function () {
		var fifth = document.getElementById('pseudos').getElementsByTagName('a')[0];
		var sixth = document.getElementById('pseudos').getElementsByTagName('div')[4];
	
		ok(Sushi('#pseudos :nth-child(3n+1)').length == 3, 'found 3 elements');
		ok(Sushi('#pseudos :nth-child(3n-2)').length == 3, 'found 3 elements'); // was +3n-2 but older safari no likey +
		ok(Sushi('#pseudos :nth-child(-n+6)').length == 6, 'found 6 elements');
		ok(Sushi('#pseudos :nth-child(-n+5)').length == 5, 'found 5 elements');
		ok(Sushi('#pseudos :nth-child(3n+2)')[1] == fifth, 'second :nth-child(3n+2) is the fifth child');
		ok(Sushi('#pseudos :nth-child(3n)')[1] == sixth, 'second :nth-child(3n) is the sixth child');
	});
	
	test(':nth-last-child(odd|even|x)', 4, function () {
		var second = document.getElementById('pseudos').getElementsByTagName('div')[1];
		ok(Sushi('#pseudos :nth-last-child(odd)').length == 4, 'found 4 odd elements');
		ok(Sushi('#pseudos div:nth-last-child(odd)').length == 3, 'found 3 odd elements with div tag');
		ok(Sushi('#pseudos div:nth-last-child(even)').length == 3, 'found 3 even elements with div tag');
		ok(Sushi('#pseudos div:nth-last-child(6)')[0] == second, '6th nth-last-child should be 2nd of 7 elements');
	});
	
	test(':nth-last-child(expr)', 5, function () {
		var third = document.getElementById('pseudos').getElementsByTagName('div')[2];
	
		ok(Sushi('#pseudos :nth-last-child(3n+1)').length == 3, 'found 3 elements');
		ok(Sushi('#pseudos :nth-last-child(3n-2)').length == 3, 'found 3 elements');
		ok(Sushi('#pseudos :nth-last-child(-n+6)').length == 6, 'found 6 elements');
		ok(Sushi('#pseudos :nth-last-child(-n+5)').length == 5, 'found 5 elements');
		ok(Sushi('#pseudos :nth-last-child(3n+2)')[0] == third, 'first :nth-last-child(3n+2) is the third child');
	});
	
	test(':nth-of-type(expr)', 6, function () {
		var a = document.getElementById('pseudos').getElementsByTagName('a')[0];
	
		ok(Sushi('#pseudos div:nth-of-type(3n+1)').length == 2, 'found 2 div elements');
		ok(Sushi('#pseudos a:nth-of-type(3n+1)').length == 1, 'found 1 a element');
		ok(Sushi('#pseudos a:nth-of-type(3n+1)')[0] == a, 'found the right a element');
		ok(Sushi('#pseudos a:nth-of-type(3n)').length == 0, 'no matches for every third a');
		ok(Sushi('#pseudos a:nth-of-type(odd)').length == 1, 'found the odd a');
		ok(Sushi('#pseudos a:nth-of-type(1)').length == 1, 'found the first a');
	});
	
	test(':nth-last-of-type(expr)', 3, function () {
		var second = document.getElementById('pseudos').getElementsByTagName('div')[1];
	
		ok(Sushi('#pseudos div:nth-last-of-type(3n+1)').length == 2, 'found 2 div elements');
		ok(Sushi('#pseudos a:nth-last-of-type(3n+1)').length == 1, 'found 1 a element');
		ok(Sushi('#pseudos div:nth-last-of-type(5)')[0] == second, '5th nth-last-of-type should be 2nd of 7 elements');
	});
	
	test(':first-of-type', 2, function () {
		ok(Sushi('#pseudos a:first-of-type')[0] == document.getElementById('pseudos').getElementsByTagName('a')[0], 'found first a element')
		ok(Sushi('#pseudos a:first-of-type').length == 1, 'found only 1')
	});
	
	test(':last-of-type', 2, function () {
		var all = document.getElementById('pseudos').getElementsByTagName('div');
		ok(Sushi('#pseudos div:last-of-type')[0] == all[all.length - 1], 'found last div element')
		ok(Sushi('#pseudos div:last-of-type').length == 1, 'found only 1')
	});
	
	test(':only-of-type', 2, function () {
		ok(Sushi('#pseudos a:only-of-type')[0] == document.getElementById('pseudos').getElementsByTagName('a')[0], 'found the only a element')
		ok(Sushi('#pseudos a:first-of-type').length == 1, 'found only 1')
	});
	
	test(':target', 2, function () {
		location.hash = '';
		ok(Sushi('#pseudos:target').length == 0, '#pseudos is not the target');
		location.hash = '#pseudos';
		ok(Sushi('#pseudos:target').length == 1, 'now #pseudos is the target');
		location.hash = '';
	});
	
	test('custom pseudos', 1, function() {
		// :humanoid implemented just for testing purposes
		ok(Sushi(':humanoid').length == 2, 'selected using custom pseudo')
	});
	
	
	module('Selecting elements in other documents', {
		setup: function() {
			
			this.frameDoc = document.getElementById('frame').contentWindow.document;
			
			this.frameDoc.body.innerHTML =
				'<div id="hsoob">' +
					'<div class="a b">' +
						'<div class="d e sib" test="fg" id="booshTest"><p><span id="spanny"></span></p></div>' +
						'<em nopass="copyrighters" rel="copyright booshrs" test="f g" class="sib"></em>' +
						'<span class="h i a sib"></span>' +
					'</div>' +
					'<p class="odd"></p>' +
				'</div>' +
				'<div id="lonelyHsoob"></div>'
		}
	});
	
	test('get element by id', 1, function () {
		
    	var result = Sushi('#hsoob', this.frameDoc);
    	ok(!!result[0], 'found element with id=hsoob');
  	});

  	test('get elements by class', 6, function () {
    	ok(Sushi('#hsoob .a', this.frameDoc).length == 2, 'found two elements');
    	ok(!!Sushi('#hsoob div.a', this.frameDoc)[0], 'found one element');
		ok(Sushi('#hsoob div', this.frameDoc).length == 2, 'found two {div} elements');
		ok(!!Sushi('#hsoob span', this.frameDoc)[0], 'found one {span} element');
		ok(!!Sushi('#hsoob div div', this.frameDoc)[0], 'found a single div');
		ok(Sushi('p.odd', this.frameDoc).length == 1, 'found single br');
	});
	
	test('complex selectors', 4, function () {
		ok(Sushi('.d ~ .sib', this.frameDoc).length === 2, 'found one ~ sibling')
		ok(Sushi('.a .d + .sib', this.frameDoc).length === 1, 'found 2 + siblings')
		ok(Sushi('#hsoob > div > .h', this.frameDoc).length === 1, 'found span using child selectors')
		ok(Sushi('.a .d ~ .sib[test="f g"]', this.frameDoc).length === 1, 'found 1 ~ sibling with test attribute')
	});
	
	test('byId sub-queries', 3, function () {
		ok(Sushi('#hsoob #spanny', this.frameDoc).length == 1, 'found "#id #id" in frame')
		ok(Sushi('.a #spanny', this.frameDoc).length == 1, 'found ".class #id" in frame')
		ok(Sushi('.a #booshTest #spanny', this.frameDoc).length == 1, 'found ".class #id #id" in frame')
	})
	
	test('byId sub-queries within sub-context', 6, function () {
		ok(Sushi('#spanny', Sushi('#hsoob', this.frameDoc)).length == 1, 'found "#id -> #id" in frame')
		ok(Sushi('.a #spanny', Sushi('#hsoob', this.frameDoc)).length == 1, 'found ".class #id" in frame')
		ok(Sushi('.a #booshTest #spanny', Sushi('#hsoob', this.frameDoc)).length == 1, 'found ".class #id #id" in frame')
		ok(Sushi('.a > #booshTest', Sushi('#hsoob', this.frameDoc)).length == 1, 'found "> .class #id" in frame')
		ok(!Sushi('#booshTest', Sushi('#spanny', this.frameDoc)).length, 'shouldn\'t find #booshTest (ancestor) within #spanny (descendent)')
		ok(!Sushi('#booshTest', Sushi('#lonelyHsoob', this.frameDoc)).length, 'shouldn\'t find #booshTest within #lonelyHsoob (unrelated)')
	})
});