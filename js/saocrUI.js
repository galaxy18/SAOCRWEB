function getUrlParam(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
    var r = window.location.search.substr(1).match(reg);  //匹配目标参数
    if (r != null) return unescape(r[2]); return ""; //返回参数值
}

var chara1;
var canvas = $('#canvas1');
var filter_rarity = "";
var filter_chara = "";
var slice = getUrlParam('slice');
var isdesktop = getUrlParam('d')!="";
var iscollect = getUrlParam('c')!="";
var genderfilter = '';
if (slice != undefined && slice != ''){
	genderfilter = getUrlParam('gender');
	if (genderfilter == undefined) genderfilter = '';
}
/*make weapon list*/
function makeweaponlist(){
	var weaponList = $('#weaponList');
	var weapons = new Array("gulid", "blade01", "blade02", "bow01", "double01", "gun01",
		"knife01", "pole01", "pole02", "rifle01", "shield01",
		"shield02", "sword01", "sword02",
		"f_blade01", "f_blade02", "f_bow01", "f_double01",
		"f_knife01", "f_pole01", "f_pole02", "f_shield01",
		"f_shield02", "f_sword01", "f_sword02", "skeleton");
	for (var i=0;i<weapons.length; i++){
		weaponList.append('<option value="'+weapons[i]+'">'+weapons[i]+'</option>');
	}
	weaponList.val('gulid');
	weaponList.change(function(){
		if (chara1 != undefined){
			if (chara1.options.weapon.startsWith('m_')){return;}
			chara1.stop = true;
		}
		chara1.options.weapon = weaponList.val();
		chara1 = new CRChara(chara1.options, chara1.canvas, 
			function(){
				canvas.find('canvas').animate({opacity: 1, marginLeft: 0}, 500);
				canvas.find('div').animate({opacity: 1}, 500);
		}).init();
	});
}
makeweaponlist();
/*make character list*/
var characterList = $('#characterList');
var tablekey = new Array();
if (getUrlParam('list') == undefined || getUrlParam('list') == ''){
	if (window.saoCRcharaTable){
		$.each(saoCRcharaTable, function(key, value){
			if (key != 'enemy')	tablekey.push(key);
		});
	}
}else{
	tablekey.push(getUrlParam('list'));
}
if (window.cacheid || (getUrlParam("id") != "" && getUrlParam("id") != undefined)){
	var option = $("<div></div>");
	if ((getUrlParam("id") != "" && getUrlParam("id") != undefined) || (!window.cacheid || cacheid == "" || cacheid == undefined)){
		option.attr("charaid", getUrlParam("id"));
	}else{
		option.attr("charaid", cacheid);
	}
	option.attr("gender", getUrlParam("gender"))
		.attr("weapon", getUrlParam("weapon"))
		.attr("rarity", getUrlParam("rarity"));
	characterList.append(option);
	characterList.hide();
	$('.option').hide();
//	$('.control').hide();
}else{
	for (var i = 0; i < tablekey.length; i++){
		var list = saoCRcharaTable[tablekey[i]];
		for (var character in list){
			var gender = list[character].gender;
			if (gender == null){
				var charaid = list[character].ID.substr(1,3);
				gender = saoCRcharaMaleList.indexOf(charaid)>=0?'m':'f';
			}
			if (genderfilter == '' || gender == genderfilter){
				var option = $("<div></div>");
				option.attr("charaid", list[character].ID)
					.attr("weapon", list[character].weapon)
					.attr("gender", gender)
					.attr("element", list[character].element)
					.attr("rarity", list[character].ID.substr(6,1))
					.attr("chara", list[character].ID.substr(1,3));
				if (list[character].awake != undefined){
					option.attr("awake", list[character].awake);
				}
				characterList.append(option);
			}
		}
	}
}

characterList = $('#characterList>div');
characterList.each(function(){
	var charaid = $(this).attr('charaid');
	$(this).css('background-image','url(assets/icon/web_'+charaid+'1.png)');
});
/*select character event*/
characterList.click(function(){
	characterList.removeClass("active");
	$(this).addClass("active");
	var charaid = $(this).attr('charaid');
	var weapon = $(this).attr('weapon');
	var gender = $(this).attr('gender');
	var element = $(this).attr('element');
	var rarity = $(this).attr('rarity');
	var chara = $(this).attr('chara');
	var awake = $(this).attr('awake');
	if (awake != undefined){
		rarity = parseInt(rarity)+1;
	}
	/*if (awake != undefined){
		if (awake == ""){awake = charaid};
	}else{awake = "";}*/
	if (element == undefined){
		element = "";
	}
	
	if (charaid != undefined){
		canvas.find('div').animate({opacity: 0}, 500);
		if (rarity == "7"){
			$('.chara_bg').removeClass('rarity7').removeClass('rarity8').removeClass('rarity9').addClass('rarity7');
		}else if (rarity == "8"){
			$('.chara_bg').removeClass('rarity7').removeClass('rarity8').removeClass('rarity9').addClass('rarity8');
		}else if (rarity == "9"){
			$('.chara_bg').removeClass('rarity7').removeClass('rarity8').removeClass('rarity9').addClass('rarity9');
		}
		canvas.find('canvas').animate({opacity: 0, marginLeft: "-50%"}, 500, function(){
			if (chara1 != undefined)chara1.stop = true;
			chara1 = new CRChara({"desktop":isdesktop, "id":charaid, "slice":slice, "weapon":weapon, "gender":gender}, canvas.find('canvas'), 
				function(){
					canvas.find('canvas').animate({opacity: 1, marginLeft: 0}, 500);
					canvas.find('div').animate({opacity: 1}, 500);
				}).init();
		});
		canvas.attr("element",element).attr("rarity",rarity).attr("chara",chara);
		if (awake != undefined){
			canvas.attr("awake",awake);
		}else{
			canvas.removeAttr("awake");
		}
		try{
			$.cookie('ID', charaid, { expires: 7/*, path: '/CR/' */});
		}catch(err){}
	}
});

$(window).resize(function() {
});
function refreshcanvasbackground(charaid, canvas){
	if (isdesktop){
		canvas.css('background-image', "none");
	}else{
		if (slice != undefined && slice != ""){
			canvas.css('background-image', "url('assets/icon/web_"+charaid+"1.png'), none");
		}else{
			if (canvas.parent().attr('awake') == ""){
				canvas.css('background-image', "url('assets/icon/web_"+charaid+"1.png'), url('assets/awake/"+charaid+".png')");
			}else if (canvas.parent().attr('awake') != undefined){
				canvas.css('background-image', "url('assets/icon/web_"+charaid+"1.png'), url('assets/awake/"+canvas.parent().attr('awake')+".png')");
			}else{
				canvas.css('background-image', "url('assets/icon/web_"+charaid+"1.png'), url('assets/large/"+charaid+".png')");
			}
			if(!iscollect){
				canvas.next().css('background-image', "url('assets/large/"+charaid+".png')");
			}
		}
	}
}
$('.option .rarity div').click(function(){
	filter_rarity = $(this).attr('data');
	if (filter_rarity === ''){
		$('.option .rarity div div').switchClass('inactive','active');
	}else{
		$('.option .rarity div div:not([data='+filter_rarity+'])').switchClass('active','inactive');
		$(this).switchClass('inactive','active');
	}
	applyfilter();
});
$('.option .chara div').click(function(){
	filter_chara = $(this).attr('data');
	if (filter_chara === ''){
		$('.option .chara>div').switchClass('inactive','active');
	}else{
		$('.option .chara>div:not([data='+filter_chara+'])').switchClass('active','inactive');
		$(this).switchClass('inactive','active');
	}
	applyfilter();
});
function applyfilter(){
	if (filter_rarity === '' && filter_chara === ''){
		$('#characterList div').show();
	}else if (filter_rarity === ''){
		$('#characterList div:not([chara='+filter_chara+'])').hide();
		$('#characterList div[chara='+filter_chara+']').show();
	}else if (filter_chara === ''){
		$('#characterList div:not([rarity='+filter_rarity+'])').hide();
		$('#characterList div[rarity='+filter_rarity+']').show();
	}else{
		$('#characterList div:not([rarity='+filter_rarity+'][chara='+filter_chara+'])').hide();
		$('#characterList div[rarity='+filter_rarity+'][chara='+filter_chara+']').show();
	}
	
	characterList = $('#characterList>div:visible');
	$("#characterList").scrollLeft(0);
	displaycount=0;
//	refreshcontrolbackground();
};
//
$('#filterhide').click(function(){
	if ($('.menu').hasClass('hide')){
		$('.menu').removeClass('hide');
		$('#filterhide').html('HIDE OPTIONS');
		$('#charalisthide').html('HIDE ALL');
	}else if($('.menu').hasClass('hidehalf')){
		$('.menu').removeClass('hidehalf');
		$('#filterhide').html('HIDE OPTIONS');
	}else{
		$('.menu').addClass('hidehalf');
		$('#filterhide').html('SHOW OPTIONS');
	}
});
$('#charalisthide').click(function(){
	if ($('.menu').hasClass('hide')){
		$('.menu').removeClass('hide');
		$('#filterhide').html('HIDE OPTIONS');
		$('#charalisthide').html('HIDE ALL');
	}else if($('.menu').hasClass('hidehalf')){
		$('.menu').removeClass('hidehalf').addClass('hide');
		$('#filterhide').html('SHOW OPTIONS');
		$('#charalisthide').html('SHOW ALL');
	}else{
		$('.menu').addClass('hide');
		$('#filterhide').html('SHOW OPTIONS');
		$('#charalisthide').html('SHOW ALL');
	}
});
//READ COOKIE
try{
	var lastid = $.cookie('ID');
	if (lastid != "" && lastid != undefined){
		$("#characterList>div[charaid='"+lastid+"']").trigger('click');
		try{
			leftpos = $("#characterList").scrollLeft() + $("#characterList>div[charaid='"+lastid+"']")[0].getBoundingClientRect().left;
			leftpos = leftpos - $("#characterList")[0].getBoundingClientRect().left; //width of button
		}catch(err){}
		$("#characterList").animate({scrollLeft: leftpos}, 500);
		displaycount = $("#characterList>div").index($("#characterList>div[charaid='"+lastid+"']"));
	}else
		$(characterList.get(0)).trigger('click');
}catch(err){
	$(characterList.get(0)).trigger('click');
}
//APPLY OPTIONS
if (isdesktop){
	if(iscollect){
		$('#canvas1>div:not(.chara_bg)').hide();
	}else{
		$('#canvas1>div').hide();
	}
	$('#CRCharacter').addClass('desktop');
	$('.menu').hide();
	$(window).resize(function() {
		$('#characterList').css('width','auto');
	});
	$('#characterList').css('width','auto');
	characterList.click(function(){
		var toppos = $("#characterList").scrollTop() + $(this)[0].getBoundingClientRect().top;
		$('#characterList').animate({scrollTop: toppos}, 500)
	});
}
if(!iscollect){
	$('#canvas1>.chara_bg').hide();
}