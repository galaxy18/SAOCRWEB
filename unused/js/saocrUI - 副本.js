function getUrlParam(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
    var r = window.location.search.substr(1).match(reg);  //匹配目标参数
    if (r != null) return unescape(r[2]); return ""; //返回参数值
}

var chara1;
var canvas = $('#canvas1>canvas');
var filter_rarity = "";
var filter_chara = "";
var slice = getUrlParam('slice');
var genderfilter = '';
if (slice != undefined && slice != ''){
	genderfilter = getUrlParam('gender');
	if (genderfilter == undefined) genderfilter = '';
}
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
	$('.control').hide();
}else{
	for (var i = 0; i < tablekey.length; i++){
		var list = saoCRcharaTable[tablekey[i]];
		for (var character in list){
			var gender = list[character].gender;
			if (genderfilter == '' || gender == genderfilter){
				var option = $("<div></div>");
				option.attr("charaid", list[character].ID)
					.attr("weapon", list[character].weapon)
					.attr("gender", list[character].gender)
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
		canvas.next().animate({opacity: 0}, 500);
		canvas.next().next().animate({opacity: 0}, 500);
		if (rarity == "7"){
			$('.chara_bg').removeClass('rarity7').removeClass('rarity8').removeClass('rarity9').addClass('rarity7');
		}else if (rarity == "8"){
			$('.chara_bg').removeClass('rarity7').removeClass('rarity8').removeClass('rarity9').addClass('rarity8');
		}else if (rarity == "9"){
			$('.chara_bg').removeClass('rarity7').removeClass('rarity8').removeClass('rarity9').addClass('rarity9');
		}
		canvas.animate({opacity: 0, marginLeft: "-50%"}, 500, function(){
			if (chara1 != undefined)chara1.stop = true;
			chara1 = new CRChara({"id":charaid, "slice":slice, "weapon":weapon, "gender":gender}, canvas, 
				function(){
					canvas.animate({opacity: 1, marginLeft: 0}, 500);
					canvas.next().animate({opacity: 1}, 500);
					canvas.next().next().animate({opacity: 1}, 500);
				}).init();
		});
		canvas.parent().attr("element",element).attr("rarity",rarity).attr("chara",chara);
		if (awake != undefined){
			canvas.parent().attr("awake",awake);
		}else{
			canvas.parent().removeAttr("awake");
		}
		try{
			$.cookie('ID', charaid, { expires: 7/*, path: '/CR/' */});
		}catch(err){}
	}
});

var displaycount = 0;
$('#characterList').width(Math.floor($("#characterList").parent().width() / 80 - 4)*80)
var displayamount = Math.floor($("#characterList").width() / 80);
refreshcontrolbackground();
$(window).resize(function() {
	$('#characterList').width(Math.floor($("#characterList").parent().width() / 80 - 4)*80)
	displayamount = Math.floor($("#characterList").width() / 80);
	refreshcontrolbackground();
});
function scrollitems(action){
	var leftpos = $("#characterList").scrollLeft();
	displaycount += action * displayamount;
	if (displaycount < 0){displaycount = 0;}
	if (displaycount >= characterList.length){displaycount = characterList.length - displayamount;}
	
	try{
		leftpos = $("#characterList").scrollLeft() + characterList.get(displaycount).getBoundingClientRect().left;
		leftpos = leftpos - $("#characterList")[0].getBoundingClientRect().left; //width of button
	}catch(err){}
	$("#characterList").animate({scrollLeft: leftpos}, 500);
	
	if (action > 0){
		$('.control>div').animate({opacity: 0, left: "-100%"}, 250, function(){
			$('.control>div').css("left","100%");
			refreshcontrolbackground();
			$('.control>div').animate({opacity: 1, left: 0}, 250);
		});
	}else{
		$('.control>div').animate({opacity: 0, left: "100%"}, 250, function(){
			$('.control>div').css("left","-100%");
			refreshcontrolbackground();
			$('.control>div').animate({opacity: 1, left: 0}, 250);
		});
	}
	
	return false;
}
function refreshcontrolbackground(){
	if (displaycount >= 1){
		$('.control>div:eq(0)').css('background-image', $(characterList.get(displaycount-1)).css('background-image'));
	}else{$('.control>div:eq(0)').css('background-image', '');}
	var rightcount = displaycount + Math.floor($("#characterList").width() / 80);
	if (rightcount <= characterList.length - 2){
		$('.control>div:eq(1)').css('background-image', $(characterList.get(rightcount)).css('background-image'));
	}else{$('.control>div:eq(1)').css('background-image', '');}
}
function refreshcanvasbackground(charaid, canvas){
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
		canvas.next().css('background-image', "url('assets/large/"+charaid+".png')");
	}
}
$('.option .rarity div div').click(function(){
	filter_rarity = $(this).attr('data');
	if (filter_rarity === ''){
		$('.option .rarity div div').switchClass('inactive','active');
	}else{
		$('.option .rarity div div:not([data='+filter_rarity+'])').switchClass('active','inactive');
		$(this).switchClass('inactive','active');
	}
	applyfilter();
});
$('.option .chara div div').click(function(){
	filter_chara = $(this).attr('data');
	if (filter_chara === ''){
		$('.option .chara div div').switchClass('inactive','active');
	}else{
		$('.option .chara div div:not([data='+filter_chara+'])').switchClass('active','inactive');
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
	refreshcontrolbackground();
};
function getUrlParam(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
    var r = window.location.search.substr(1).match(reg);  //匹配目标参数
    if (r != null) return unescape(r[2]); return null; //返回参数值
}

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