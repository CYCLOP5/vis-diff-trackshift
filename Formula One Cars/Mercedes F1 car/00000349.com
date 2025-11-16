<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML+RDFa 1.0//EN"
  "http://www.w3.org/MarkUp/DTD/xhtml-rdfa-1.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" version="XHTML+RDFa 1.0" dir="ltr">

<head profile="http://www.w3.org/1999/xhtml/vocab">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<link rel="canonical" href="https://www.team-bhp.com/" />
<link rel="shortlink" href="https://www.team-bhp.com/" />
<meta name="description" content="Team-BHP takes ZERO advertising money from the auto industry, hence provides the most trusted, detailed and unbiased Car Reviews &amp; News in India." />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="Generator" content="Drupal 7 (http://drupal.org)" />
<link rel="shortcut icon" href="https://www.team-bhp.com/misc/favicon.ico" type="image/vnd.microsoft.icon" />
  <title>Team-BHP - India's Most Trusted Car Reviews & News</title>
  <style type="text/css" media="all">@import url("https://www.team-bhp.com/modules/system/system.base.css?r2lcpt");
@import url("https://www.team-bhp.com/modules/system/system.menus.css?r2lcpt");
@import url("https://www.team-bhp.com/modules/system/system.messages.css?r2lcpt");
@import url("https://www.team-bhp.com/modules/system/system.theme.css?r2lcpt");</style>
<style type="text/css" media="all">@import url("https://www.team-bhp.com/modules/comment/comment.css?r2lcpt");
@import url("https://www.team-bhp.com/sites/all/modules/date/date_api/date.css?r2lcpt");
@import url("https://www.team-bhp.com/sites/all/modules/date/date_popup/themes/datepicker.1.7.css?r2lcpt");
@import url("https://www.team-bhp.com/modules/field/theme/field.css?r2lcpt");
@import url("https://www.team-bhp.com/modules/node/node.css?r2lcpt");
@import url("https://www.team-bhp.com/modules/search/search.css?r2lcpt");
@import url("https://www.team-bhp.com/modules/user/user.css?r2lcpt");
@import url("https://www.team-bhp.com/sites/all/modules/views/css/views.css?r2lcpt");</style>
<style type="text/css" media="all">@import url("https://www.team-bhp.com/sites/all/modules/ctools/css/ctools.css?r2lcpt");
@import url("https://www.team-bhp.com/sites/all/modules/teambhp_mod/css/teambhp_mod.css?r2lcpt");</style>
<style type="text/css" media="all">@import url("https://www.team-bhp.com/themes/bhp/css/layout.css?r2lcpt");
@import url("https://www.team-bhp.com/themes/bhp/css/style.css?r2lcpt");
@import url("https://www.team-bhp.com/themes/bhp/css/colors.css?r2lcpt");
@import url("https://www.team-bhp.com/themes/bhp/css/home.css?r2lcpt");
@import url("https://www.team-bhp.com/themes/bhp/css/rupees.css?r2lcpt");</style>
<style type="text/css" media="print">@import url("https://www.team-bhp.com/themes/bhp/css/print.css?r2lcpt");</style>
  
	
	<!-- Universal Analytics -->
	<script>
	  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

	  ga('create', 'UA-4898097-10', 'auto');
	  ga('create', 'UA-4898097-11', 'auto', {'name': 'secondTracker'});  // New tracker
	  ga('require', 'linkid', {'levels': 5}); // Enhanced Link Attribution on PORTAL 2013 Account. Max DOM levels for element ID. 3 by default
	  ga('send', 'pageview');
	  ga('secondTracker.send', 'pageview'); // Send page view for second tracker
	</script>  
  
  <script type="text/javascript" src="https://www.team-bhp.com/misc/jquery.js?v=1.4.4"></script>
<script type="text/javascript" src="https://www.team-bhp.com/misc/jquery.once.js?v=1.2"></script>
<script type="text/javascript" src="https://www.team-bhp.com/misc/drupal.js?r2lcpt"></script>
<script type="text/javascript">
<!--//--><![CDATA[//><!--
jQuery(document).ready(function () { test(); });
//--><!]]>
</script>
<script type="text/javascript" src="https://www.team-bhp.com/sites/all/modules/teambhp_mod/js/teambhp_mod.js?r2lcpt"></script>
<script type="text/javascript" src="https://www.team-bhp.com/sites/all/modules/multiimage_mod/js/common.js?r2lcpt"></script>
<script type="text/javascript">
<!--//--><![CDATA[//><!--
jQuery(document).ready(function () { /*jQuery("form#gallery-images-node-form").find("label:contains('Alternate text')").each(function(i){ jQuery(this).text('Image Sequence'); jQuery(this).closest("div.form-item").find("div.description").text("Image sequence used to display images on overview page"); });*/ jQuery("#edit-field-spec-nr-engine-type-und-0-nid").live("change", function(){ var eId = jQuery(this).val(); var start = eId.indexOf("[")+5; var end = eId.indexOf("]")-(eId.indexOf("[")+5); jQuery.ajax({ type: "POST", url: "/themes/bhp/getTransmission.php", data: "eId="+eId.substr(start, end), success: function(data){	if(data!="") {  jQuery("#edit-field-spec-engine-transmission-und-0-value").val(data); jQuery("#edit-field-spec-engine-transmission-und-0-value").attr("readonly", "readonly"); jQuery("div.form-item-field-spec-engine-transmission-und-0-value").find("div.description").html("Transmission fetched from selected <strong>Engine</strong>"); } else { jQuery("#edit-field-spec-engine-transmission-und-0-value").val(""); jQuery("#edit-field-spec-engine-transmission-und-0-value").removeAttr("readonly"); jQuery("div.form-item-field-spec-engine-transmission-und-0-value").find("div.description").html("example <strong>6-speed Manual</strong>"); } } }); }); jQuery("#edit-field-gallery-model-und-0-nid").live("change", function(){ jQuery("form#gallery-images-node-form").find("#edit-title").val(jQuery("#autocomplete ul li.selected").text()); }); jQuery("#edit-field-gallery-model-und-0-nid").live("blur", function(){ var modelStr = jQuery("#edit-field-gallery-model-und-0-nid").val(); jQuery("form#gallery-images-node-form").find("#edit-title").val(modelStr.substr(0, modelStr.indexOf(" ["))); }); jQuery("#edit-field-nr-make-und-0-nid").live("change", function(){ jQuery("form#model-node-form").find("#edit-title").val(jQuery("#autocomplete ul li.selected").text()+" "); }); jQuery("#edit-field-nr-make-und-0-nid").live("blur", function(){ var modelStr = jQuery("#edit-field-nr-make-und-0-nid").val(); jQuery("form#model-node-form").find("#edit-title").val(modelStr.substr(0, modelStr.indexOf(" ["))+" "); }); jQuery("#edit-field-spec-nr-engine-type-und-0-nid").live("change blur", function(){ var modelText = jQuery("#autocomplete ul li.selected").text(); jQuery("form#specifications-node-form").find("#edit-title").val(modelText.substr(2, modelText.indexOf("]")-2)); }); jQuery("#edit-field-features-nr-variant-und-0-nid").live("change blur", function(){ var modelText = jQuery("#autocomplete ul li.selected").text(); jQuery("form#features-node-form").find("#edit-title").val(modelText.substr(2, modelText.indexOf(" -")-3)); }); jQuery("#edit-field-price-nr-variant-und-0-nid").live("change blur", function(){ var modelText = jQuery("#autocomplete ul li.selected").text(); jQuery("form#price-node-form").find("#edit-title").val(modelText.substr(2, modelText.indexOf(" -")-3)); }); jQuery("form#make-node-form").find("#edit-title").blur(function(){ var xhr; if(xhr) { xhr.abort(); } var make = jQuery(this).val(); xhr = jQuery.ajax({type: "POST",async: false, url: "/themes/bhp/includes/checkMake.php",data: "make="+make,success: function(data){ if(data==1){ if(jQuery("form#make-node-form").find("#duplicateMake").length==0) { jQuery("form#make-node-form").find("#edit-title").after("<span id=\"duplicateMake\" class=\"error\">&nbsp;&nbsp;Duplicate Entry</span>"); jQuery("form#make-node-form").attr("onSubmit", "alert(\"Duplicate Manufacturer's Name\"); return false;"); } } else { jQuery("form#make-node-form").find("#duplicateMake").remove(); jQuery("form#make-node-form").removeAttr("onSubmit"); } }}); }); /*jQuery("#edit-field-forum-model-und-0-nid").live("change blur", function(){ var modelText = jQuery("#autocomplete ul li.selected").text(); jQuery("form#forum-reviews-node-form").find("#edit-title").val(jQuery.trim(modelText.substr(modelText.indexOf(" - ")+4))); }); if(jQuery("#edit-field-news-tags-und").length>0){ jQuery("#edit-field-news-tags-und").closest(".form-item").find(".description").html("Use at least ONE of these tags: Launches & Updates, Industry & Policy, Scoops & Rumours, Commercial Vehicles, Sales & Analysis, 2-Wheels, Other, Motorsports, Member Content. Use commas to separate each tag."); }*/ if(jQuery("#news-category-node-form").length>0){ jQuery("#news-category-node-form").find("#edit-title").closest(".form-item").append("<div class=\"description\">Select at least on of the following News Categories:<br />Launches & Updates, Industry & Policy, Scoops & Rumours, Commercial Vehicles, Sales & Analysis, 2-Wheels, Other, Motorsports, Member Content</div>"); } });
//--><!]]>
</script>
<script type="text/javascript">
<!--//--><![CDATA[//><!--
var usersOnline; jQuery(function(){ usersOnline = jQuery("div#userContent").find("td").eq(1).text(); if(usersOnline.length>5) {usersOnline = usersOnline.substr(-5); } for(var i=0; i<usersOnline.length; i++){ jQuery("div.userCount").find("li").eq(i).text(usersOnline.substr(i, 1)); } jQuery("div.siteStats ul li:first").find("strong").text(jQuery("div#userContent").find("tr").eq(3).find("td").eq(1).text()); jQuery("div.siteStats ul li").eq(1).find("strong").text(jQuery("div#userContent").find("tr").eq(5).find("td").eq(1).text()); jQuery("div.siteStats ul li").eq(2).find("strong").text(jQuery("div#userContent").find("tr").eq(7).find("td").eq(1).text()); });
//--><!]]>
</script>
<script type="text/javascript" src="https://www.team-bhp.com/themes/bhp/js/jquery-1.5.1.js?r2lcpt"></script>
<script type="text/javascript" src="https://www.team-bhp.com/themes/bhp/js/dd.js?r2lcpt"></script>
<script type="text/javascript" src="https://www.team-bhp.com/themes/bhp/js/pp.js?r2lcpt"></script>
<script type="text/javascript" src="https://www.team-bhp.com/themes/bhp/js/formValidation.js?r2lcpt"></script>
<script type="text/javascript" src="https://www.team-bhp.com/themes/bhp/js/jquery.jcarousel.min.js?r2lcpt"></script>
<script type="text/javascript" src="https://www.team-bhp.com/themes/bhp/js/jquery.cookie.js?r2lcpt"></script>
<script type="text/javascript" src="https://www.team-bhp.com/themes/bhp/js/jquery.corner.js?r2lcpt"></script>
<script type="text/javascript" src="https://www.team-bhp.com/themes/bhp/js/jquery.ui.core.js?r2lcpt"></script>
<script type="text/javascript" src="https://www.team-bhp.com/themes/bhp/js/jquery.ui.widget.js?r2lcpt"></script>
<script type="text/javascript" src="https://www.team-bhp.com/themes/bhp/js/jquery.lightbox.js?r2lcpt"></script>
<script type="text/javascript" src="https://www.team-bhp.com/themes/bhp/js/jquery.ui.accordion.js?r2lcpt"></script>
<script type="text/javascript" src="https://www.team-bhp.com/themes/bhp/js/jquery.ui.mouse.js?r2lcpt"></script>
<script type="text/javascript" src="https://www.team-bhp.com/themes/bhp/js/jquery.ui.slider.js?r2lcpt"></script>
<script type="text/javascript" src="https://www.team-bhp.com/themes/bhp/js/rounded.js?r2lcpt"></script>
<script type="text/javascript" src="https://www.team-bhp.com/themes/bhp/js/selectivizr.js?r2lcpt"></script>
<script type="text/javascript" src="https://www.team-bhp.com/themes/bhp/js/custom-form-elements.js?r2lcpt"></script>
<script type="text/javascript">
<!--//--><![CDATA[//><!--
jQuery.extend(Drupal.settings, {"basePath":"\u002F", "pathPrefix":"", "ajaxPageState":{"theme":"bhp", "theme_token":"jfYtpbE0DTVqvA6NFB1wbw0YJhsQmpGQHC2oet34kBY", "js":{"misc\u002Fjquery.js":1, "misc\u002Fjquery.once.js":1, "misc\u002Fdrupal.js":1, "0":1, "sites\u002Fall\u002Fmodules\u002Fteambhp_mod\u002Fjs\u002Fteambhp_mod.js":1, "sites\u002Fall\u002Fmodules\u002Fmultiimage_mod\u002Fjs\u002Fcommon.js":1, "1":1, "2":1, "themes\u002Fbhp\u002Fjs\u002Fjquery-1.5.1.js":1, "themes\u002Fbhp\u002Fjs\u002Fdd.js":1, "themes\u002Fbhp\u002Fjs\u002Fpp.js":1, "themes\u002Fbhp\u002Fjs\u002FformValidation.js":1, "themes\u002Fbhp\u002Fjs\u002Fjquery.jcarousel.min.js":1, "themes\u002Fbhp\u002Fjs\u002Fjquery.cookie.js":1, "themes\u002Fbhp\u002Fjs\u002Fjquery.corner.js":1, "themes\u002Fbhp\u002Fjs\u002Fjquery.ui.core.js":1, "themes\u002Fbhp\u002Fjs\u002Fjquery.ui.widget.js":1, "themes\u002Fbhp\u002Fjs\u002Fjquery.lightbox.js":1, "themes\u002Fbhp\u002Fjs\u002Fjquery.ui.accordion.js":1, "themes\u002Fbhp\u002Fjs\u002Fjquery.ui.mouse.js":1, "themes\u002Fbhp\u002Fjs\u002Fjquery.ui.slider.js":1, "themes\u002Fbhp\u002Fjs\u002Frounded.js":1, "themes\u002Fbhp\u002Fjs\u002Fselectivizr.js":1, "themes\u002Fbhp\u002Fjs\u002Fcustom-form-elements.js":1}, "css":{"modules\u002Fsystem\u002Fsystem.base.css":1, "modules\u002Fsystem\u002Fsystem.menus.css":1, "modules\u002Fsystem\u002Fsystem.messages.css":1, "modules\u002Fsystem\u002Fsystem.theme.css":1, "modules\u002Fcomment\u002Fcomment.css":1, "sites\u002Fall\u002Fmodules\u002Fdate\u002Fdate_api\u002Fdate.css":1, "sites\u002Fall\u002Fmodules\u002Fdate\u002Fdate_popup\u002Fthemes\u002Fdatepicker.1.7.css":1, "modules\u002Ffield\u002Ftheme\u002Ffield.css":1, "modules\u002Fnode\u002Fnode.css":1, "modules\u002Fsearch\u002Fsearch.css":1, "modules\u002Fuser\u002Fuser.css":1, "sites\u002Fall\u002Fmodules\u002Fviews\u002Fcss\u002Fviews.css":1, "sites\u002Fall\u002Fmodules\u002Fctools\u002Fcss\u002Fctools.css":1, "sites\u002Fall\u002Fmodules\u002Fteambhp_mod\u002Fcss\u002Fteambhp_mod.css":1, "themes\u002Fbhp\u002Fcss\u002Flayout.css":1, "themes\u002Fbhp\u002Fcss\u002Fstyle.css":1, "themes\u002Fbhp\u002Fcss\u002Fcolors.css":1, "themes\u002Fbhp\u002Fcss\u002Fhome.css":1, "themes\u002Fbhp\u002Fcss\u002Frupees.css":1, "themes\u002Fbhp\u002Fcss\u002Fprint.css":1}}});
//--><!]]>
</script>
  <script src="//connect.facebook.net/en_US/all.js"></script>
 			<meta property="og:title" content="Home | Team-BHP - The Definitive Indian Car Website"/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="https://www.team-bhp.com"/>
<meta property="og:image" content="https://www.team-bhp.com/themes/bhp/images/teambhp-og-image-fb.jpg"/>
<meta property="og:site_name" content="Team-BHP.com"/>
<meta property="fb:admins" content="1504944662"/>
<meta property="og:description" content="Team-BHP - Redlining the Indian Automobile Scene"/>

<!-- For leaderboard google ad etc -->
<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>
<script>
  window.googletag = window.googletag || {cmd: []};
  googletag.cmd.push(function() {
    googletag.defineSlot('/1063105/970x250Homepage', [[970, 250], [728, 90]], 'div-gpt-ad-1598414828438-0').addService(googletag.pubads());
    googletag.defineSlot('/1063105/belownews', [618, 80], 'div-gpt-ad-1455011226405-0').addService(googletag.pubads());
    googletag.defineSlot('/1063105/newsskyscraper', [225, 500], 'div-gpt-ad-1455703231503-0').addService(googletag.pubads());
    googletag.defineSlot('/1063105/desktopsliderportal', [[300, 250], [560, 320]], 'div-gpt-ad-1633587773151-0').addService(googletag.pubads());
    googletag.pubads().enableSingleRequest();
    googletag.pubads().collapseEmptyDivs();
    googletag.enableServices();
  });
</script>

</head>

<body class="html front not-logged-in one-sidebar sidebar-second page-node page-node- page-node-210 node-type-page homePage" >
<div id="fb-root"></div>
<script>(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_US/all.js#xfbml=1";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));</script>
<div class="bgHolder clearfix">
  <div id="skip-link">
    <a href="#main-content" class="element-invisible element-focusable">Skip to main content</a>
  </div>
    <div class="region region-page-top">
    <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Organization",
		  "name": "Team-BHP",
		  "@id": "https://www.team-bhp.com/#organization",
		  "url": "https://www.team-bhp.com/",
          "logo": "https://www.team-bhp.com/themes/bhp/images/team-bhp-logo-190x60.png",
          "sameAs": [
            "https://www.facebook.com/teambhp/",
            "https://twitter.com/teambhpforum",
            "https://www.instagram.com/teambhp/",
            "https://www.youtube.com/teamBHPChannel"
          ]
        }
        </script>  </div>
  <div id="page-wrapper">

	<div id="page" class="page pageWithSlide clearfix">

		<div id="leftPage" class="fleft">
			<div id="header" class="without-secondary-menu">
				<div class="section clearfix">
				
					
		
										  <div id="name-and-slogan">
				
												  
						  
						  
										
				
					  </div> 
					
				      <div class="region region-header">
    <div id="block-block-34" class="block block-block">

    
  <div class="content">
    <script type="text/javascript">
(function ($) {
		$(function(){
			$(".listHolder").hover(
			function(){
					$(this).addClass("hover");
				},
			function(){
					$(this).removeClass("hover");
					}
			);
			
			$(".mv_tab_content li").hover(
			function(){
					$(this).addClass("hover");
				},
			function(){
					$(this).removeClass("hover");
					}
			);
			
			$(".carAdded").hover(
			function(){
					$(this).addClass("carAddedhover");
				},
			function(){
					$(this).removeClass("carAddedhover");
					}
			);
			
			$(".carListing li").hover(
			function(){
					$(this).addClass("hover");
				},
			function(){
					$(this).removeClass("hover");
					}
			);
			
			$("ul#newslist li").click(function(){
						 window.location=$(this).find('h2 a').attr('href');
					});
			
		

			$("#compareBtn").click(function() {
				if($(".reviewCompare").css("display")=="none") {
					$(this).removeClass("compareOpen");
					$(this).parent("div").removeClass("marB10");
					$(this).addClass("compareClose");
					$(".reviewCompare").css("display","block");
					//$(".contentOpt:first").css("display","block");
					return false;
				}else {
					$(this).removeClass("compareClose");
					$(this).parent("div").addClass("marB10");
					$(this).addClass("compareOpen");
					$(".reviewCompare").css("display","none");
					/*$(".reviewCompare, .contentOpt, .content").css("display","none");
					$(".reviewCompare li:not(:last)").attr("class", "num");
					$(".reviewCompare li").find(".n").removeAttr("style");
					$(".reviewCompare li:first").attr("class", "clearfix");
					$(".contentOpt select.marB5 option:first").attr('selected', 'selected');
					$(".contentOpt select.w150 option:first").attr('selected', 'selected');*/
					return false;
				}
			});
			
			//show/hide interaction
			$i = 1;
			$('option.flip').click(function(){
				if($(this).closest('.contentOpt').find('select.marB5 option:selected').text()=='Honda')
					{
						$(this).closest('.contentOpt').hide();
						$(this).closest('.clearfix').find('.content').show();
						$(this).closest('.clearfix').next('li.num').find('.n').hide();
						$(this).closest('.clearfix').next('li.num').find('.contentOpt').show();
						$(this).closest('.clearfix').next('li.num').attr('class', 'clearfix');
					}
				if($i>1)
				{
				$('#compare').attr('href', 'compare.php?s='+$i);
				}
				$i++
			});
			
			//add car to compare
			/*$(".add").click(function(){
				$('.reviewCompare').css('display', 'block');
				$('div.content:hidden').eq(0).closest('li').find('.contentOpt').hide();
				$('div.content:hidden').eq(0).closest('li').attr('class', 'clearfix');
				$('div.content:hidden').eq(1).closest('li').find('.n').hide();
				$('div.content:hidden').eq(1).closest('li').find('.contentOpt').show();
				$('div.content:hidden').eq(1).closest('li').attr('class', 'clearfix');
				$('div.content:hidden').eq(0).show();
				$('#compareBtn').removeClass("compareOpen");
				$('#compareBtn').parent("div").removeClass("marB10");
				$('#compareBtn').addClass("compareClose");
				if($i>1)
				{
				$('#compare').attr('href', 'compare.php?s='+$i);
				}
				$i++;
				return false;
			});*/
			
			
	
			/*var activeTab = $(this).find("a").attr("href"); //Find the href attribute value to identify the active tab + content
			$(activeTab).fadeIn(); //Fade in the active ID content
			return false;
			});*/
			
			$("#addCar").click(function(){
				if ($(this).siblings(".addCarForm").css("display")=="none"){
					$(this).parent(".addCarBox").addClass("addCarOpen");
					$(this).siblings(".addCarForm").fadeIn(500);
					return false;
				}else {
					$(this).parent(".addCarBox").removeClass("addCarOpen");
					$(this).siblings(".addCarForm").fadeOut("fast");
					return false;
				}
			});
			
			$("#closeForm").click(function(){
				$(this).parent().parent(".addCarBox").removeClass("addCarOpen");
				$(this).parent(".addCarForm").fadeOut("fast");
				return false;
			});
			
			$("#knowMore").click(function(){
				$("#reviewContent").fadeIn("slow");
				$(".showLess").fadeIn("slow");
				$("#overviewmore").parent().fadeOut("slow");
				$(this).parent().fadeOut("slow");
				$(this).parent().parent().addClass("reviewRollrBorder");
				return false;
			});
			
			$(".showLess").click(function(){
				$("#reviewContent").fadeOut("slow");
				$(this).fadeOut("slow");
				$("#knowMore").parent().fadeIn("slow");
				$("#overviewmore").parent().fadeIn("slow");
				$(this).parent().removeClass("reviewRollrBorder");
				return false;
			});
			
			/*$( "#slider-range" ).slider({
				orientation: "horizontal",
				range: true,
				values: [ 15, 20 ],
				max: 30,
				min: 5,
				slide: function( event, ui ) {
					
					$("#max-amount").text(ui.values[ 1 ]);
					$("#mini-amount").text(ui.values[ 0 ]);
					
					$maxRange = $("#slider-range").find("a").eq(1).attr("style").substr(6);
					$miniRange = $("#slider-range").find("a").eq(0).attr("style").substr(6);
					
					$("#max-amount").attr("style", "left:"+$maxRange);
					$("#mini-amount").attr("style", "left:"+$miniRange);
				},
				
				change: function(event, ui) {
					$maxRange = $("#slider-range").find("a").eq(1).attr("style").substr(6);
					$miniRange = $("#slider-range").find("a").eq(0).attr("style").substr(6);
					
					$("#max-amount").attr("style", "left:"+$maxRange);
					$("#mini-amount").attr("style", "left:"+$miniRange);
				}
				
			});
			
			if($("#slider-range").length>0)
			{
			$maxRange = $("#slider-range").find("a").eq(1).attr("style").substr(6);
			$miniRange = $("#slider-range").find("a").eq(0).attr("style").substr(6);
			}
			
			$("#max-amount").text($("#slider-range" ).slider( "values", 1 ));
			$("#mini-amount").text( $( "#slider-range" ).slider( "values", 0 ));
			
			if($("#slider-range").length>0)
			{
			$("#max-amount").attr("style", "left:"+$maxRange);
			$("#mini-amount").attr("style", "left:"+$miniRange);
			}*/
			
		$("#search_input").bind("focus click", function(){
		 	if($(this).val()=="Search")
		 		{
		 			$(this).val('');
		 		}
		 });
		 
		 $("#search_input").bind("blur", function(){
		 	if(($(this).val()=="Search") || ($(this).val()==''))
		 		{
		 			$(this).val('Search');
		 		}
		 });
		 	
		 	$("#setHomePage").click(function(){
		 		//setHomePage();
			 });
	
	});
})(jQuery);	

</script>

<div id="header" class="clearfix">
	<div class="fleft w400">
		<div class="marT10">
			<a href="/" title="Go to Home page">
				<img src="/themes/bhp/images/team-bhp-logo.png" alt="TEAM-BHP-LOGO" class="logoTeam" />	
				<div class="printlogo"><img src="/themes/bhp/images/team-bhp-logo-print.gif" alt="TEAM-BHP-LOGO" />	</div>
			</a>
		</div>
	</div><!-- w400 -->
	
	<div class="fright aln_right w400 clearfix">
		<div class="topLink marT5">
			<!-- <a id="setHomePage" href="#" title="Make Team-BHP your Home Page">Make Team-BHP your Home Page</a>&nbsp;&nbsp;| -->
			<a href="/aboutus/overview" title="About Us">About Us</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="/contactus/speak" title="Contact Us">Contact Us</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="/sitemap" title="Sitemap">Sitemap</a>
		</div>	<!-- tab Link -->

		<a href="#" class="marT5 quicklinks" >
			&nbsp;
		</a>
		<div class="marT10 clearfix">
			<!--  <form id="cse-search-box" class="roundAll5" action="q=node/247">-->
			<form id="cse-search-box" class="roundAll5" action="/search.php">
			    <input type="hidden" value="partner-pub-8422315737402856:zcmboq-gw8i" name="cx" />
			    <input type="hidden" value="FORID:9" name="cof" />
			    <input type="hidden" value="ISO-8859-1" name="ie" />
			    <input type="text" id="search_input" class="gloablSearch roundAll3" value="Search" name="q" />
			    <input type="submit" id="search_button" class="gloablSearchBtn" value="" name="sa" />
			</form>
			<!-- <div id="cse" style="width: 100%;">Loading</div>
			<script src="https://www.google.co.in/jsapi" type="text/javascript"></script>
			<script type="text/javascript"> 
			  google.load('search', '1', {language : 'en'});
			  google.setOnLoadCallback(function() {
			    var customSearchOptions = {};
			    var imageSearchOptions = {};
			    imageSearchOptions['layout'] = google.search.ImageSearch.LAYOUT_POPUP;
			    customSearchOptions['enableImageSearch'] = true;
			    customSearchOptions['imageSearchOptions'] = imageSearchOptions;
			    var googleAnalyticsOptions = {};
			    googleAnalyticsOptions['queryParameter'] = '\x3B';
			    googleAnalyticsOptions['categoryParameter'] = '';
			    customSearchOptions['googleAnalyticsOptions'] = googleAnalyticsOptions;
			    customSearchOptions['adoptions'] = {'layout': 'noTop'};
			    var customSearchControl = new google.search.CustomSearchControl(
			      'partner-pub-8422315737402856:zcmboq-gw8i', customSearchOptions);
			    customSearchControl.setResultSetSize(google.search.Search.FILTERED_CSE_RESULTSET);
			    var options = new google.search.DrawOptions();
			    options.setAutoComplete(true);
			    customSearchControl.draw('cse', options);
			  }, true);
			</script> -->
		</div>
	</div><!-- w400-->
</div> <!--  header -->	
  </div>
</div>
<div id="block-block-35" class="block block-block">

    
  <div class="content">
    


<div class="clearfix" id="navigation">
        <ul class="clearfix"  itemscope itemtype="https://www.schema.org/SiteNavigationElement">
               <!-- <li class="home"><a class=" active" href="https://www.team-bhp.com/" title="Go to Home page"><span>&nbsp;</span></a></li> -->
                <li itemprop="name"><a itemprop="url" href="https://www.team-bhp.com/forum/" title="Forum"><span>Forum</span></a></li>
                <li itemprop="name"><a itemprop="url" class="" href="https://www.team-bhp.com/hot-threads" title="Hot Threads
"><span>Hot Threads</span></a></li>
                <li itemprop="name"><a itemprop="url" class="" href="https://www.team-bhp.com/news"
title="News"><span>News</span></a></li>
                <li itemprop="name"><a itemprop="url" class="" href="/forum/official-new-car-
reviews/?pp=25&sort=dateline&order=desc&daysprune=-1" title="Reviews"><span>Reviews</span></a></li>
				<li><a class="" href="https://www.bigboytoyz.com/collection" rel="sponsored" onclick="ga('secondTracker.send','event','Supercars_Navbar', 'Portal')" target="_blank" title="Buy Luxury Cars"><span>Luxury Cars</span></a></li>
				<li><a class="" href="https://www.turtlewax.in/" rel="sponsored" onclick="ga('secondTracker.send','event','TurtleWax_Navbar', 'Portal')" target="_blank" title="Turtle Wax"><span>Turtle Wax</span></a></li>
				<li><a class="" href="https://www.wheelswisdom.com/navbar/" rel="sponsored" onclick="ga('secondTracker.send','event','ServiceYourCar_Navbar', 'Portal')" target="_blank" title="Service Your Car"><span>Service Your Car</span></a></li>				
				<li><a class="" href="https://www.cars24.com/mkt/?utm_source=teambhp&utm_medium=header_nav_bar&utm_campaign=desktop" rel="sponsored" onclick="ga('secondTracker.send','event','Cars24_Navbar', 'Portal')" target="_blank" title="Sell Your Car"><span>Sell Your Car</span></a></li>
                <li><a class="" href="https://oriparts.com/?utm_source=team-bhp&utm_medium=link&utm_campaign=main" rel="sponsored" onclick="ga('secondTracker.send','event','Boodmo_Navbar', 'Portal')" target="_blank" title="Spare Parts"><span>Spare Parts</span></a></li>
                <li itemprop="name"><a itemprop="url" href="https://classifieds.team-bhp.com/" title="Classifieds"><span>Classifieds</span></a></li>
                <li itemprop="name" class="last"><a itemprop="url" class="" href="https://store.team-bhp.com/?utm_source=Por
tal&utm_medium=NavBar&utm_campaign=TBHP" title="Store"><span>Store</span></a></li>
                </ul>
</div><!-- navigation -->

  </div>
</div>
  </div>

							</div><!-- section -->
			</div> <!--  /#header -->
			
						
			<div class="billboardSpacer">
				<div class="absoluteCenter">
					<!-- /1063105/970x250Homepage -->
					<div id='div-gpt-ad-1598414828438-0' style='height: 250px; text-align: center;'>
					  <script>
						googletag.cmd.push(function() { googletag.display('div-gpt-ad-1598414828438-0'); });
					  </script>
					</div>
				</div>
			</div>
			
			<div id="container" class="clearfix roundAll3">

		<div id="content" class="column">
			<div class="section">
				  				  <a id="main-content"></a>
				  				  				  					<div class="tabs">
					  					</div>
				  				  				  				    <div class="region region-content">
    <div id="block-system-main" class="block block-system">

    
  <div class="content">
    <div id="node-210" class="node node-page node-promoted clearfix">

      
  
  <div class="content clearfix">
    <div class="field field-name-body field-type-text-with-summary field-label-hidden"><div class="field-items"><div class="field-item even"><div class="marB10 clearfix">
	<div id="leftColumn" class="fleft">
	
		<script type="text/javascript">	
var count=0;
var count1=0;
(function ($) {
$(function(){

$i=0;
$n=0;

	var myInt = setInterval(function(){
  		count ++;
  		if(count==5){
			$j = $i+1;
		 	count = 0;
		 
		 	if($j<$("div.banner").length)
		 		{
		 		$("div.banner").eq($i).fadeIn(800, function(){
					$("div.banner").fadeOut("slow");
					$("div.banner").eq($j).fadeIn("slow");
   					$(".bannerTabs ul li").removeClass("active");
	   				$(".bannerTabs ul li").eq($j).addClass("active");
	   				$("#bannerTitle a").text($(this).next().attr("title"));
	   				$("#bannerTitle a").attr("href", $(this).next().attr("rel"));
	   			});	   			
		 		$i = $i+1;
		 		}
		 	else
		 		{
		 		$i=0;
		 		$("div.banner").eq($("div.banner").length-1).fadeIn(800, function(){
		 			$("div.banner").fadeOut("slow");
   					$("div.banner").eq(0).fadeIn("slow");
   					$(".bannerTabs ul li").removeClass("active");
	   				$(".bannerTabs ul li").eq(0).addClass("active");
	   				$("#bannerTitle a").text($("div.banner").eq(0).attr("title"));
	   				$("#bannerTitle a").attr("href", $("div.banner").eq(0).attr("rel"));
	   			});
		 		}
		 	}
		},1000);

	$(".bannerTabs ul li").click(function(){
		$listItem = $('ul.highlighter li').index(this);
		$(".bannerTabs ul li").removeClass("active");
		$(this).addClass("active");
		$("div.banner").fadeOut(600);
		$($(this).attr("rel")).fadeIn(600);
		$bannerTitle = $(this).attr("rel");
		$("#bannerTitle a").text($($bannerTitle).attr("title"));
		$("#bannerTitle a").attr("href", $($bannerTitle).attr("rel"));
		count=0;
		$i=$listItem;
		return false;
	});
});
})(jQuery);
</script>
<div id="highlights" class="homeBanner">
	<div class="BLR5 bannerTabs clearfix">
		<ul class="highlighter clearfix">
						<li class="active" rel="#story-1">&nbsp;</li>  
						<li rel="#story-2">&nbsp;</li>  
						<li rel="#story-3">&nbsp;</li>  
						<li rel="#story-4">&nbsp;</li>  
						<li rel="#story-5">&nbsp;</li>  
						<li rel="#story-6">&nbsp;</li>  
							
		</ul>
				<div id="bannerTitle" class="fright"><a href="https://www.team-bhp.com/forum/official-new-car-reviews/243612-skoda-slavia-first-drive-preview-13.html#post5198048">Pics: Skoda Slavia Unveiled</a></div>
	</div>
				<div class="roundAll5 banner" title="Pics: Skoda Slavia Unveiled" rel="https://www.team-bhp.com/forum/official-new-car-reviews/243612-skoda-slavia-first-drive-preview-13.html#post5198048" id="story-1" style="display:table;"><a href="https://www.team-bhp.com/forum/official-new-car-reviews/243612-skoda-slavia-first-drive-preview-13.html#post5198048"><img src="sites/default/files/skoda-slavia-banner.jpg"  alt="Pics: Skoda Slavia Unveiled"/></a></div>
				<div class="roundAll5 banner" title="Your Automotive Regrets" rel="https://www.team-bhp.com/forum/indian-car-scene/244487-tell-us-about-your-automotive-regrets.html" id="story-2" style="display:none;"><a href="https://www.team-bhp.com/forum/indian-car-scene/244487-tell-us-about-your-automotive-regrets.html"><img src="sites/default/files/dc-avanti-banner.jpg"  alt="Your Automotive Regrets"/></a></div>
				<div class="roundAll5 banner" title="Got back my Mahindra Classic!" rel="https://www.team-bhp.com/forum/4x4-vehicles/70885-impulsive-buy-1999-mahindra-classic-sold-bought-back-after-10-years-36.html#post5151934" id="story-3" style="display:none;"><a href="https://www.team-bhp.com/forum/4x4-vehicles/70885-impulsive-buy-1999-mahindra-classic-sold-bought-back-after-10-years-36.html#post5151934"><img src="sites/default/files/mahindra-classic-banner.jpg"  alt="Got back my Mahindra Classic!"/></a></div>
				<div class="roundAll5 banner" title="The Flooded Jeep Compass..." rel="https://www.team-bhp.com/forum/indian-car-loans-insurance/244086-my-brand-new-jeep-compass-flooded-basement-now-what-3.html#post5198006" id="story-4" style="display:none;"><a href="https://www.team-bhp.com/forum/indian-car-loans-insurance/244086-my-brand-new-jeep-compass-flooded-basement-now-what-3.html#post5198006"><img src="sites/default/files/jeep-compass-flooded-banner.jpg"  alt="The Flooded Jeep Compass..."/></a></div>
				<div class="roundAll5 banner" title="2021 Maruti Celerio Review" rel="https://www.team-bhp.com/forum/official-new-car-reviews/244480-2021-maruti-celerio-review.html" id="story-5" style="display:none;"><a href="https://www.team-bhp.com/forum/official-new-car-reviews/244480-2021-maruti-celerio-review.html"><img src="sites/default/files/2021-celerio-review-banner.jpg"  alt="2021 Maruti Celerio Review"/></a></div>
				<div class="roundAll5 banner" title="To Giridih, Deoghar &amp; Simultala" rel="https://www.team-bhp.com/forum/travelogues/244404-road-trip-giridih-deoghar-simultala-dhanbad.html" id="story-6" style="display:none;"><a href="https://www.team-bhp.com/forum/travelogues/244404-road-trip-giridih-deoghar-simultala-dhanbad.html"><img src="sites/default/files/santro-road-trip-banner.jpg"  alt="To Giridih, Deoghar &amp; Simultala"/></a></div>
			</div><!--homePageBanner-->
		
		<script type="text/javascript">
(function ($) {
	$(function(){
		$(".homeTab .tab a").click(function(){
			if ($($(this).attr("href")).css("display")=="none") {
				$(".homeTab .tab a").removeClass("active");
				$(this).addClass("active");
				$(".homeTab .tabContent").css("display","none");
				$($(this).attr("href")).fadeIn(800);
			}
			return false;
		});
			$(".titleLi").click(function()
			{
			location.href='/news';
			});
		
		 	$("#mtrbik").click(function()
			{
			location.href='/?q=hot-threads&catname=Motorbikes';
			});
			
			 $("#car_rview").click(function()
			{
				//location.href='/reviews';
			    location.href='/forum/official-new-car-reviews/?pp=25&sort=dateline&order=desc&daysprune=-1';
			}); 
			$("#htthread").click(function()
			{
			location.href='/hot-threads';
			});
			 $("div.primBlock h4.TLR5").click(function()
			{
			location.href='/advice';
			});
			 $("div.primBlock h4.tech_stuffspcl").click(function()
			{
			location.href='/tech-stuff';
			});
			 $("div#trav_home").click(function()
			{
			location.href='/?q=hot-threads&catname=Travelogues';
			});
			$(".app").click(function()
			{
			window.open('/forum/team-bhp-apps-mobile-access/', '_blank');
			return false;
			});
			$("div.searchClassi h4.TLR5").click(function(){
				location.href = "https://classifieds.team-bhp.com/";
				return false;
			});
		
	});
	
	
	
})(jQuery);
</script>
<div class="homeTab">
	<ul class="tab TLR5 clearfix">
		<li class="titleLi"><h2>News</h2></li>
		<li class="secondLi"><a title="Latest" class="TLR5 active news" href="#tab1" id="tab1indian">Latest</a></li>
		<li><a title="Most Viewed" class="TLR5" href="#tab2" id="tab2International">Most Viewed</a></li>
	</ul>
	<div class="tab_container BLR5">
		<div id="tab1" class="tabContent" style="display:block">
			
									<ul class="homeCarList clearfix">
												<li>
							<a class="clearfix" href="/news/hyundai-ioniq-5-electric-car-spotted-road" title="Hyundai Ioniq 5 electric car spotted on the road">
								<!-- <img width="70" height="53" src="sites/default/files/D3484D208ACA411EA50785D6D3D6FAC4.jpeg" alt="Hyundai Ioniq 5 electric car spotted on the road" />-->
								<span>
									<strong>
									<img src="/?q=sites/default/files/styles/check_thumb_review_detail/public/D3484D208ACA411EA50785D6D3D6FAC4.jpeg" alt="Hyundai Ioniq 5 electric car spotted on the road" />
									</strong></span>
								<em>Hyundai Ioniq 5 electric car spotted on the road</em>
							</a>	
						</li>
											<li>
							<a class="clearfix" href="/news/ola-s1-pro-could-be-offered-custom-paint-finishes" title="Ola S1 Pro could be offered with custom paint finishes">
								<!-- <img width="70" height="53" src="sites/default/files/2021-ola-s1-30_0.jpg" alt="Ola S1 Pro could be offered with custom paint finishes" />-->
								<span>
									<strong>
									<img src="/?q=sites/default/files/styles/check_thumb_review_detail/public/2021-ola-s1-30_0.jpg" alt="Ola S1 Pro could be offered with custom paint finishes" />
									</strong></span>
								<em>Ola S1 Pro could be offered with custom paint finishes</em>
							</a>	
						</li>
											<li>
							<a class="clearfix" href="/news/toyota-belta-rebadged-ciaz-revealed-middle-east" title="Toyota Belta (rebadged Ciaz) revealed in the Middle East">
								<!-- <img width="70" height="53" src="sites/default/files/Toyota-Belta-unvieled-1276x720.jpg" alt="Toyota Belta (rebadged Ciaz) revealed in the Middle East" />-->
								<span>
									<strong>
									<img src="/?q=sites/default/files/styles/check_thumb_review_detail/public/Toyota-Belta-unvieled-1276x720.jpg" alt="Toyota Belta (rebadged Ciaz) revealed in the Middle East" />
									</strong></span>
								<em>Toyota Belta (rebadged Ciaz) revealed in the Middle East</em>
							</a>	
						</li>
											<li>
							<a class="clearfix" href="/news/harley-davidson-sportster-s-be-launched-ibw-2021" title="Harley-Davidson Sportster S to be launched at IBW 2021">
								<!-- <img width="70" height="53" src="sites/default/files/FEhqyw0VUAAbPJC.jpg" alt="Harley-Davidson Sportster S to be launched at IBW 2021" />-->
								<span>
									<strong>
									<img src="/?q=sites/default/files/styles/check_thumb_review_detail/public/FEhqyw0VUAAbPJC.jpg" alt="Harley-Davidson Sportster S to be launched at IBW 2021" />
									</strong></span>
								<em>Harley-Davidson Sportster S to be launched at IBW 2021</em>
							</a>	
						</li>
											<li>
							<a class="clearfix" href="/news/apple-car-focus-full-autonomous-tech-debut-2025" title="Apple car to focus on full-autonomous tech; debut in 2025">
								<!-- <img width="70" height="53" src="sites/default/files/apple-logo_1.jpg" alt="Apple car to focus on full-autonomous tech; debut in 2025" />-->
								<span>
									<strong>
									<img src="/?q=sites/default/files/styles/check_thumb_review_detail/public/apple-logo_1.jpg" alt="Apple car to focus on full-autonomous tech; debut in 2025" />
									</strong></span>
								<em>Apple car to focus on full-autonomous tech; debut in 2025</em>
							</a>	
						</li>
											<li>
							<a class="clearfix" href="/news/ford-gm-enter-semiconductor-business-mitigate-shortage" title="Ford &amp; GM enter semiconductor business to mitigate shortage">
								<!-- <img width="70" height="53" src="sites/default/files/ford-gm-semiconductors.jpg" alt="Ford & GM enter semiconductor business to mitigate shortage" />-->
								<span>
									<strong>
									<img src="/?q=sites/default/files/styles/check_thumb_review_detail/public/ford-gm-semiconductors.jpg" alt="Ford &amp; GM enter semiconductor business to mitigate shortage" />
									</strong></span>
								<em>Ford & GM enter semiconductor business to mitigate shortage</em>
							</a>	
						</li>
											<li>
							<a class="clearfix" href="/news/india-made-2022-honda-navi-launched-usa" title="India-made 2022 Honda Navi launched in the USA">
								<!-- <img width="70" height="53" src="sites/default/files/KT7BAJXRDJEF7DPDBUQ642AW44.jpg" alt="India-made 2022 Honda Navi launched in the USA" />-->
								<span>
									<strong>
									<img src="/?q=sites/default/files/styles/check_thumb_review_detail/public/KT7BAJXRDJEF7DPDBUQ642AW44.jpg" alt="India-made 2022 Honda Navi launched in the USA" />
									</strong></span>
								<em>India-made 2022 Honda Navi launched in the USA</em>
							</a>	
						</li>
											<li>
							<a class="clearfix" href="/news/royal-enfield-lines-four-new-350cc-bikes-india" title="Royal Enfield lines up four new 350cc bikes for India">
								<!-- <img width="70" height="53" src="sites/default/files/01-redditch-grey.png" alt="Royal Enfield lines up four new 350cc bikes for India" />-->
								<span>
									<strong>
									<img src="/?q=sites/default/files/styles/check_thumb_review_detail/public/01-redditch-grey.png" alt="Royal Enfield lines up four new 350cc bikes for India" />
									</strong></span>
								<em>Royal Enfield lines up four new 350cc bikes for India</em>
							</a>	
						</li>
											<li>
							<a class="clearfix" href="/news/ola-s1-pro-be-used-netherlands-embassy-india" title="Ola S1 Pro to be used by the Netherlands Embassy in India">
								<!-- <img width="70" height="53" src="sites/default/files/IMG20211117WA0011.jpg" alt="Ola S1 Pro to be used by the Netherlands Embassy in India" />-->
								<span>
									<strong>
									<img src="/?q=sites/default/files/styles/check_thumb_review_detail/public/IMG20211117WA0011.jpg" alt="Ola S1 Pro to be used by the Netherlands Embassy in India" />
									</strong></span>
								<em>Ola S1 Pro to be used by the Netherlands Embassy in India</em>
							</a>	
						</li>
									 	</ul><!-- homeCarList -->
					<div class="marT10 marR12 clearfix">
						<a title="View All News" href="news" class="fright btnRight">
							<span>View All News</span>
						</a>
					</div>
			
						
		</div><!-- tabContent -->
		<div id="tab2" class="tabContent news" style="display:none">
			
									<ul class="homeCarList clearfix">
					
								<li>
					<a class="clearfix" href="/news/my-tata-nexon-ev-road-trip-experience-1300-km-2-days" title="My Tata Nexon EV road trip experience: 1300 km in 2 days">
					<!-- <img width="70" height="53" src="sites/default/files/tata-nexon-ev-roadtrip-4.jpeg" alt="My Tata Nexon EV road trip experience: 1300 km in 2 days" /> -->
					<span>
						<strong>
						<img src="/?q=sites/default/files/styles/check_thumb_review_detail/public/tata-nexon-ev-roadtrip-4.jpeg" alt="My Tata Nexon EV road trip experience: 1300 km in 2 days" />
						</strong>
						</span>
						
						<em>My Tata Nexon EV road trip experience: 1300 km in 2 days</em>
					</a>	
				</li>
								<li>
					<a class="clearfix" href="/news/why-i-bought-honda-city-over-seltos-creta" title="Why I bought a Honda City over the Seltos &amp; Creta">
					<!-- <img width="70" height="53" src="sites/default/files/honda-city-new.jpg" alt="Why I bought a Honda City over the Seltos & Creta" /> -->
					<span>
						<strong>
						<img src="/?q=sites/default/files/styles/check_thumb_review_detail/public/honda-city-new.jpg" alt="Why I bought a Honda City over the Seltos &amp; Creta" />
						</strong>
						</span>
						
						<em>Why I bought a Honda City over the Seltos & Creta</em>
					</a>	
				</li>
								<li>
					<a class="clearfix" href="/news/mahindra-xuv700-owner-review-hits-misses-good-bad-ugly" title="Mahindra XUV700 Owner Review, Hits, Misses, Good, Bad &amp; Ugly">
					<!-- <img width="70" height="53" src="sites/default/files/mahindra-xuv700-4.jpeg" alt="Mahindra XUV700 Owner Review, Hits, Misses, Good, Bad & Ugly" /> -->
					<span>
						<strong>
						<img src="/?q=sites/default/files/styles/check_thumb_review_detail/public/mahindra-xuv700-4.jpeg" alt="Mahindra XUV700 Owner Review, Hits, Misses, Good, Bad &amp; Ugly" />
						</strong>
						</span>
						
						<em>Mahindra XUV700 Owner Review, Hits, Misses, Good, Bad & Ugly</em>
					</a>	
				</li>
								<li>
					<a class="clearfix" href="/news/ola-s1-electric-scooter-observations-after-1-day-riding" title="Ola S1 Electric Scooter: Observations after 1 day of riding">
					<!-- <img width="70" height="53" src="sites/default/files/2021-ola-s1-11.jpg" alt="Ola S1 Electric Scooter: Observations after 1 day of riding" /> -->
					<span>
						<strong>
						<img src="/?q=sites/default/files/styles/check_thumb_review_detail/public/2021-ola-s1-11.jpg" alt="Ola S1 Electric Scooter: Observations after 1 day of riding" />
						</strong>
						</span>
						
						<em>Ola S1 Electric Scooter: Observations after 1 day of riding</em>
					</a>	
				</li>
								<li>
					<a class="clearfix" href="/news/mahindra-xuv700-vs-tata-safari-my-next-upgrade" title="Mahindra XUV700 vs Tata Safari: My next upgrade">
					<!-- <img width="70" height="53" src="sites/default/files/mahindra-xuv700.jpeg" alt="Mahindra XUV700 vs Tata Safari: My next upgrade" /> -->
					<span>
						<strong>
						<img src="/?q=sites/default/files/styles/check_thumb_review_detail/public/mahindra-xuv700.jpeg" alt="Mahindra XUV700 vs Tata Safari: My next upgrade" />
						</strong>
						</span>
						
						<em>Mahindra XUV700 vs Tata Safari: My next upgrade</em>
					</a>	
				</li>
								<li>
					<a class="clearfix" href="/news/completely-fed-my-bmws-18-inch-alloy-wheels-india" title="Completely fed up of my BMW&#039;s 18-inch alloy wheels in India">
					<!-- <img width="70" height="53" src="sites/default/files/20210916 13.42.21.jpg" alt="Completely fed up of my BMW's 18-inch alloy wheels in India" /> -->
					<span>
						<strong>
						<img src="/?q=sites/default/files/styles/check_thumb_review_detail/public/20210916 13.42.21.jpg" alt="Completely fed up of my BMW&#039;s 18-inch alloy wheels in India" />
						</strong>
						</span>
						
						<em>Completely fed up of my BMW's 18-inch alloy wheels in India</em>
					</a>	
				</li>
								<li>
					<a class="clearfix" href="/news/budget-rs-15-20-lakh-buying-my-first-car" title="Budget Rs. 15-20 lakh: Buying my first car">
					<!-- <img width="70" height="53" src="sites/default/files/xuv_0.jpg" alt="Budget Rs. 15-20 lakh: Buying my first car" /> -->
					<span>
						<strong>
						<img src="/?q=sites/default/files/styles/check_thumb_review_detail/public/xuv_0.jpg" alt="Budget Rs. 15-20 lakh: Buying my first car" />
						</strong>
						</span>
						
						<em>Budget Rs. 15-20 lakh: Buying my first car</em>
					</a>	
				</li>
								<li>
					<a class="clearfix" href="/news/first-impressions-new-force-gurkha" title="First impressions of the new Force Gurkha">
					<!-- <img width="70" height="53" src="sites/default/files/new-force-gurkha-6.jpg" alt="First impressions of the new Force Gurkha" /> -->
					<span>
						<strong>
						<img src="/?q=sites/default/files/styles/check_thumb_review_detail/public/new-force-gurkha-6.jpg" alt="First impressions of the new Force Gurkha" />
						</strong>
						</span>
						
						<em>First impressions of the new Force Gurkha</em>
					</a>	
				</li>
								<li>
					<a class="clearfix" href="/news/2021-maruti-celerio-our-observations-after-day-driving" title="2021 Maruti Celerio: Our observations after a day of driving">
					<!-- <img width="70" height="53" src="sites/default/files/2021-maruti-celerio-10.jpg" alt="2021 Maruti Celerio: Our observations after a day of driving" /> -->
					<span>
						<strong>
						<img src="/?q=sites/default/files/styles/check_thumb_review_detail/public/2021-maruti-celerio-10.jpg" alt="2021 Maruti Celerio: Our observations after a day of driving" />
						</strong>
						</span>
						
						<em>2021 Maruti Celerio: Our observations after a day of driving</em>
					</a>	
				</li>
								
				</ul><!-- homeCarList -->
				<div class="marT10 marR12 clearfix">
					<a title="View All News" href="news" class="fright btnRight">
						<span>View All News</span>
					</a>
				</div>
			
						
		</div><!-- tabContent -->
	</div><!-- tab_container -->	
</div><!-- homeTab -->

<div style="text-align:center;">
	<!-- /1063105/belownews -->
	<div id='div-gpt-ad-1455011226405-0' style='margin-top:4px; margin-bottom:10px;'>
	<script type='text/javascript'>
	googletag.cmd.push(function() { googletag.display('div-gpt-ad-1455011226405-0'); });
	</script>
	</div>
</div>
		
		<div class="homeReview">
	<h3 class="TLR5 clearfix">
		<strong class="title" id="car_rview">Reviews</strong><!-- code for this click event writen in home-news-->
		<span class="options">
			<select name="make" onchange="showmodelbymake(this.value);">
				<option value="0">Select a Make</option>
								<option value="31403">All Motorbikes</option>
								<option value="5766">Ashok Leyland</option>
								<option value="2242">Audi</option>
								<option value="2243">BMW</option>
								<option value="2244">Chevrolet</option>
								<option value="30074">Citroen</option>
								<option value="6412">Datsun</option>
								<option value="2245">Fiat</option>
								<option value="2246">Force</option>
								<option value="1975">Ford</option>
								<option value="2248">Honda</option>
								<option value="2249">Hyundai</option>
								<option value="6737">Isuzu</option>
								<option value="2250">Jaguar</option>
								<option value="11822">Jeep</option>
								<option value="16063">Kia</option>
								<option value="2251">Land Rover</option>
								<option value="15078">Lexus</option>
								<option value="98">Mahindra</option>
								<option value="2">Maruti Suzuki</option>
								<option value="2252">Mercedes-Benz</option>
								<option value="18989">MG</option>
								<option value="3799">Mini</option>
								<option value="174">Mitsubishi</option>
								<option value="187">Nissan</option>
								<option value="8557">Porsche</option>
								<option value="5843">Rage Motorsport</option>
								<option value="193">Renault</option>
								<option value="2254">Skoda</option>
								<option value="330">Tata</option>
								<option value="29208">Tesla</option>
								<option value="2255">Toyota</option>
								<option value="2256">Volkswagen</option>
								<option value="871">Volvo</option>
							</select>
		</span>
	</h3>
	<div id="ajax">
	<div class="reviewContent BLR5">
	
		<ul class="reviewList clearfix">
										<li>

														<a href="https://www.team-bhp.com/forum/official-new-car-reviews/244480-2021-maruti-celerio-review.html" title="2021 Maruti Celerio">
								<!-- <img width="175" height="131" src="sites/default/files/" alt="2021 Maruti Celerio" /> -->
								<img src="/sites/default/files/styles/check_car_review_home/public/2021-celerio-review-1_0.jpg" alt="2021 Maruti Celerio" />
								<b>
								<span>2021 Maruti Celerio</span>
								</b>
							</a>
						</li>
										<li>

														<a href="https://www.team-bhp.com/forum/motorbikes/244398-ola-s1-electric-scooter-review.html" title="Ola S1 Electric Scooter">
								<!-- <img width="175" height="131" src="sites/default/files/" alt="Ola S1 Electric Scooter" /> -->
								<img src="/sites/default/files/styles/check_car_review_home/public/ola-s1-scooter-review-edit.jpg" alt="Ola S1 Electric Scooter" />
								<b>
								<span>Ola S1 Electric Scooter</span>
								</b>
							</a>
						</li>
										<li>

														<a href="https://www.team-bhp.com/forum/test-drives-initial-ownership-reports/244192-my-2021-jeep-compass-petrol-ownership-review.html" title="Jeep Compass Petrol AT Facelift">
								<!-- <img width="175" height="131" src="sites/default/files/" alt="Jeep Compass Petrol AT Facelift" /> -->
								<img src="/sites/default/files/styles/check_car_review_home/public/jeep-compass-review-1.jpg" alt="Jeep Compass Petrol AT Facelift" />
								<b>
								<span>Jeep Compass Petrol AT Facelift</span>
								</b>
							</a>
						</li>
										<li>

														<a href="https://www.team-bhp.com/forum/test-drives-initial-ownership-reports/241183-blue-bolt-our-bmw-x3-30i-ownership-review.html" title="BMW X3 Petrol">
								<!-- <img width="175" height="131" src="sites/default/files/" alt="BMW X3 Petrol" /> -->
								<img src="/sites/default/files/styles/check_car_review_home/public/bmw-x3-petrol-1.jpg" alt="BMW X3 Petrol" />
								<b>
								<span>BMW X3 Petrol</span>
								</b>
							</a>
						</li>
										<li>

														<a href="https://www.team-bhp.com/forum/test-drives-initial-ownership-reports/243711-dream-come-true-my-phytonic-blue-bmw-x3-g01-xdrive-20d-luxury-line-review.html" title="BMW X3 Diesel">
								<!-- <img width="175" height="131" src="sites/default/files/" alt="BMW X3 Diesel" /> -->
								<img src="/sites/default/files/styles/check_car_review_home/public/bmw-x3-review-onweship.jpg" alt="BMW X3 Diesel" />
								<b>
								<span>BMW X3 Diesel</span>
								</b>
							</a>
						</li>
										<li>

														<a href="https://www.team-bhp.com/forum/official-new-car-reviews/243690-2021-audi-q5-facelift-review.html" title="Audi Q5 Facelift">
								<!-- <img width="175" height="131" src="sites/default/files/" alt="Audi Q5 Facelift" /> -->
								<img src="/sites/default/files/styles/check_car_review_home/public/2021-audi-q5-review-1_0.jpg" alt="Audi Q5 Facelift" />
								<b>
								<span>Audi Q5 Facelift</span>
								</b>
							</a>
						</li>
						   </ul><!-- reviewList -->
		<div class="marR12 marT10 clearfix">
			<a title="View all car & bike reviews" href="/forum/official-new-car-reviews/?pp=25&sort=dateline&order=desc&daysprune=-1" class="fright btnRight">
				<span>View All Reviews</span>
			</a>
		</div>
	</div><!-- reviewContent -->
	</div><!-- end of ajax -->
</div><!-- homeReview -->
	
	</div><!-- left column -->
	
	
	<div id="sidebar" class="fright">
		<div class="searchClassi">
	<h3 class="TLR5">Got BHP?</h3>
	<div class="searchContent BLR5">
		<ul>
			<li><a id="homepageMerchandiseLink" href="http://store.team-bhp.com/?utm_source=Portal&utm_medium=HomeGotBHPBox&utm_campaign=TBHP" target="_blank" title="Team-BHP Merchandise">Merchandise</a></li>
			
			<li><a class="sedans" id="homepageNewsletterLink" href="http://team-bhp.us4.list-manage.com/subscribe?u=10e084528b02b3c554ebf47a8&id=39df29de53" target="_blank" title="Daily Newsletter">Daily Newsletter</a></li>
			
			<li>
				<a class="SUV" id="homepageFacebookLink" href="http://www.facebook.com/teambhp" target="_blank" title="Facebook Page">Facebook</a>
				<div class="facebookclickable"><div class="fb-like" data-href="http://facebook.com/teambhp" data-width="120" data-layout="button_count" data-action="like" data-show-faces="false" data-share="false"></div></div>
			</li>
			
			<li class="BLR5">
				<a class="luxury" id="homepageTwitterLink" href="http://twitter.com/teambhpforum" target="_blank" title="Twitter">Twitter</a>
				<div class="twitterclickable"><a href="https://twitter.com/TeamBHPforum" class="twitter-follow-button" data-show-count="false" data-show-screen-name="false" data-dnt="true">Follow @TeamBHPforum</a>
<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');</script></div>
			</li>
		</ul>
	</div><!-- searchContent -->
</div><!-- searchClassi -->
		<div class="homeThreads">
	<h3 class="TLR5" id="htthread">Hot Threads</h3><!-- code for this click event wriiten in home-news-->
	<div class="threadsList BLR5">
		<ul>
						<li id="htthread1"><a href="https://www.team-bhp.com/forum/official-new-car-reviews/243612-skoda-slavia-first-drive-preview-13.html#post5198048" target="_blank" onclick="updatethreadcounter('https://www.team-bhp.com/forum/official-new-car-reviews/243612-skoda-slavia-first-drive-preview-13.html#post5198048','36605');" title="Pics: Skoda Slavia Unveiled">Pics: Skoda Slavia Unveiled</a></li>
						<li id="htthread2"><a href="https://www.team-bhp.com/forum/indian-car-scene/244487-tell-us-about-your-automotive-regrets.html" target="_blank" onclick="updatethreadcounter('https://www.team-bhp.com/forum/indian-car-scene/244487-tell-us-about-your-automotive-regrets.html','36604');" title="Your Automotive Regrets">Your Automotive Regrets</a></li>
						<li id="htthread3"><a href="https://www.team-bhp.com/forum/4x4-vehicles/70885-impulsive-buy-1999-mahindra-classic-sold-bought-back-after-10-years-36.html#post5151934" target="_blank" onclick="updatethreadcounter('https://www.team-bhp.com/forum/4x4-vehicles/70885-impulsive-buy-1999-mahindra-classic-sold-bought-back-after-10-years-36.html#post5151934','36603');" title="Got back my Mahindra Classic!">Got back my Mahindra Classic!</a></li>
						<li id="htthread4"><a href="https://www.team-bhp.com/forum/indian-car-loans-insurance/244086-my-brand-new-jeep-compass-flooded-basement-now-what-3.html#post5198006" target="_blank" onclick="updatethreadcounter('https://www.team-bhp.com/forum/indian-car-loans-insurance/244086-my-brand-new-jeep-compass-flooded-basement-now-what-3.html#post5198006','36602');" title="The flooded Jeep Compass...">The flooded Jeep Compass...</a></li>
						<li id="htthread5"><a href="https://www.team-bhp.com/forum/sedans/244529-keep-10-year-old-toyota-corolla-altis-buy-new-honda-city.html" target="_blank" onclick="updatethreadcounter('https://www.team-bhp.com/forum/sedans/244529-keep-10-year-old-toyota-corolla-altis-buy-new-honda-city.html','36601');" title="Sell Corolla to buy Honda City?">Sell Corolla to buy Honda City?</a></li>
						<li id="htthread6"><a href="https://www.team-bhp.com/forum/indian-car-scene/244521-supreme-court-people-5-star-hotels-blaming-farmers-no-action-against-gas-guzzling-hi-fi-cars.html" target="_blank" onclick="updatethreadcounter('https://www.team-bhp.com/forum/indian-car-scene/244521-supreme-court-people-5-star-hotels-blaming-farmers-no-action-against-gas-guzzling-hi-fi-cars.html','36600');" title="Hotel customers blaming farmers">Hotel customers blaming farmers</a></li>
						<li id="htthread7"><a href="https://www.team-bhp.com/forum/superbikes-imports/244532-sold-my-ninja-650-what-motorcycle-should-i-now-buy.html" target="_blank" onclick="updatethreadcounter('https://www.team-bhp.com/forum/superbikes-imports/244532-sold-my-ninja-650-what-motorcycle-should-i-now-buy.html','36599');" title="Sold Ninja 650 | What bike?">Sold Ninja 650 | What bike?</a></li>
						<li id="htthread8"><a href="https://www.team-bhp.com/forum/street-experiences/244536-swanky-pod-rooms-mumbai-central-railway-station.html" target="_blank" onclick="updatethreadcounter('https://www.team-bhp.com/forum/street-experiences/244536-swanky-pod-rooms-mumbai-central-railway-station.html','36598');" title="Swanky pods at railway station">Swanky pods at railway station</a></li>
						<li id="htthread9"><a href="https://www.team-bhp.com/forum/official-new-car-reviews/244480-2021-maruti-celerio-review.html" target="_blank" onclick="updatethreadcounter('https://www.team-bhp.com/forum/official-new-car-reviews/244480-2021-maruti-celerio-review.html','36576');" title="Review: 2021 Maruti Celerio">Review: 2021 Maruti Celerio</a></li>
						<li id="htthread10"><a href="https://www.team-bhp.com/forum/road-safety/86897-accidents-vehicles-catching-fire-india-49.html#post5195233" target="_blank" onclick="updatethreadcounter('https://www.team-bhp.com/forum/road-safety/86897-accidents-vehicles-catching-fire-india-49.html#post5195233','36575');" title="New Honda City catches fire">New Honda City catches fire</a></li>
						<li id="htthread11"><a href="https://www.team-bhp.com/forum/motorbikes/244398-ola-s1-electric-scooter-review-6.html#post5197136" target="_blank" onclick="updatethreadcounter('https://www.team-bhp.com/forum/motorbikes/244398-ola-s1-electric-scooter-review-6.html#post5197136','36574');" title="More on the Ola S1 Scooter">More on the Ola S1 Scooter</a></li>
						<li id="htthread12"><a href="https://www.team-bhp.com/forum/modifications-accessories/244396-why-you-should-not-replace-rear-reflectors-led-light-accessories.html" target="_blank" onclick="updatethreadcounter('https://www.team-bhp.com/forum/modifications-accessories/244396-why-you-should-not-replace-rear-reflectors-led-light-accessories.html','36573');" title="Rear reflectors &gt; LED lights">Rear reflectors > LED lights</a></li>
						<li id="htthread13"><a href="https://www.team-bhp.com/forum/indian-car-scene/228394-pre-worshipped-car-week-buying-used-bmw-3-series-f30-5.html#post5195483" target="_blank" onclick="updatethreadcounter('https://www.team-bhp.com/forum/indian-car-scene/228394-pre-worshipped-car-week-buying-used-bmw-3-series-f30-5.html#post5195483','36572');" title="Bought a used BMW 320d">Bought a used BMW 320d</a></li>
						<li id="htthread14"><a href="https://www.team-bhp.com/forum/travelogues/244404-road-trip-giridih-deoghar-simultala-dhanbad.html" target="_blank" onclick="updatethreadcounter('https://www.team-bhp.com/forum/travelogues/244404-road-trip-giridih-deoghar-simultala-dhanbad.html','36571');" title="To Giridih, Deoghar &amp; Simultala">To Giridih, Deoghar & Simultala</a></li>
						<li id="htthread15"><a href="https://www.team-bhp.com/forum/indian-car-scene/244433-supreme-court-says-manufacturer-cant-held-liable-deficiency-service-authorised-dealers.html" target="_blank" onclick="updatethreadcounter('https://www.team-bhp.com/forum/indian-car-scene/244433-supreme-court-says-manufacturer-cant-held-liable-deficiency-service-authorised-dealers.html','36570');" title="OEM not liable for dealer service">OEM not liable for dealer service</a></li>
						<li id="htthread16"><a href="https://www.team-bhp.com/forum/indian-car-scene/223738-mercedes-amg-a45s-launched-india.html#post5196869" target="_blank" onclick="updatethreadcounter('https://www.team-bhp.com/forum/indian-car-scene/223738-mercedes-amg-a45s-launched-india.html#post5196869','36569');" title="Mercedes-AMG A45 S revealed">Mercedes-AMG A45 S revealed</a></li>
						<li id="htthread17"><a href="https://www.team-bhp.com/forum/shifting-gears/38683-jobs-attrition-companies-25.html#post5196349" target="_blank" onclick="updatethreadcounter('https://www.team-bhp.com/forum/shifting-gears/38683-jobs-attrition-companies-25.html#post5196349','36568');" title="Jobs, attrition &amp; IT companies">Jobs, attrition & IT companies</a></li>
						<li id="htthread18"><a href="https://www.team-bhp.com/forum/motorbikes/244504-new-suzuki-scooter-teased-launch-november-18-a.html" target="_blank" onclick="updatethreadcounter('https://www.team-bhp.com/forum/motorbikes/244504-new-suzuki-scooter-teased-launch-november-18-a.html','36567');" title="New Suzuki scooter teased">New Suzuki scooter teased</a></li>
						<li id="htthread19"><a href="https://www.team-bhp.com/forum/international-automotive-scene/244416-audi-buys-mclaren-group-secures-formula-1-entry-edit-mclaren-denies.html" target="_blank" onclick="updatethreadcounter('https://www.team-bhp.com/forum/international-automotive-scene/244416-audi-buys-mclaren-group-secures-formula-1-entry-edit-mclaren-denies.html','36566');" title="On the Audi-McLaren rumours">On the Audi-McLaren rumours</a></li>
						<li id="htthread20"><a href="https://www.team-bhp.com/forum/long-term-ownership-reviews/182917-our-silver-sprinter-volkswagen-jetta-2-0-tdi-edit-92-000-km-up-5.html#post5197025" target="_blank" onclick="updatethreadcounter('https://www.team-bhp.com/forum/long-term-ownership-reviews/182917-our-silver-sprinter-volkswagen-jetta-2-0-tdi-edit-92-000-km-up-5.html#post5197025','36538');" title="VW Jetta | 92000 km Review">VW Jetta | 92000 km Review</a></li>
					</ul>
		<div class="marR15 clearfix">
			<a title="More hot threads" href="/hot-threads" class="fright btnRight">
				<span>More Hot Threads</span>
			</a>
		</div><!-- marR15 -->
	</div><!-- threadsList -->
</div><!-- homeThreads -->
	</div><!-- sidebar -->
</div><!-- clearfix -->

	
<!--<ul class="whatCar clearfix">
	<li class="first LTB5">What Car ?</li>
	<li class="last RTB5 clearfix">
		<div class="fleft">
			<h5><strong>Confused which car to buy ?</strong> Get expert Team BHP opinion.</h5>
			<p>We will help you make a better choice. Participate in the forum discussions. </p>
		</div>
		<a href="/forum/" class="fright marT10 btnRight" title="Go to the Forum">
			<span>Go to the Forum</span>
		</a>
	</li>
</ul> -->
<!--<div class="app clearfix">
	<div class="appLeftBox">
		<span class="stayupdate">Stay updated on the move</span>
		<strong>Team-BHP App</strong> <span class="teamApp"> for iPhone & Android</span>
	</div>
	<a href="/forum/team-bhp-apps-mobile-access/" title="Free Download" class="freeDownBtn roundAll5">
		<span>Free <em>Download</em></span>
	</a>
</div> -->
	
<div class="clearfix">
	<div id="leftColumn" class="fleft">
	
		<div class="homeTra">
	<a href="/?q=hot-threads&catname=Travelogues" class="roundAll5 homeTravel clearfix">
				<img src="/sites/default/files/9-plantationroad.jpg" alt="Road through plantations" />
			
	</a>
	<div class="fleft travels" id="trav_home"><!-- code for this click event writen in home-news-->
		<h3>Travelogues</h3>
		<p>Experiences, Route info &amp; Photos posted by Team-BHP members</p>
	</div>
	<ul class="travelList roundAll5">
				<li><a href="https://www.team-bhp.com/forum/travelogues/244404-road-trip-giridih-deoghar-simultala-dhanbad.html" target="_blank" title="To Giridih, Deoghar &amp; Simultala">To Giridih, Deoghar & Simultala</a></li>
				<li><a href="https://www.team-bhp.com/forum/travelogues/244354-washington-usa-2021-photo-blog-1-mt-baker-snoqualmie-falls-fall-season.html" target="_blank" title="With a BMW X3 in Washington">With a BMW X3 in Washington</a></li>
				<li><a href="https://www.team-bhp.com/forum/travelogues/244224-western-ghats-temples-old-car.html" target="_blank" title="Drive: Western Ghats &amp; Temples">Drive: Western Ghats & Temples</a></li>
				<li><a href="https://www.team-bhp.com/forum/travelogues/243699-ciazzler-roadtrip-kasauli-renuka-lake-dehradun-durga-puja-some-excellent-bad-roads.html" target="_blank" title="Kasauli &amp; Dehradun in a Ciaz">Kasauli & Dehradun in a Ciaz</a></li>
				<li><a href="https://www.team-bhp.com/forum/travelogues/244066-driving-via-seventh-wonder-land-peace-toyota-innova-crysta.html" target="_blank" title="3800 km road-trip in a Crysta!">3800 km road-trip in a Crysta!</a></li>
				<!--  <li><a href="#">Road trip to Ladakh</a></li>
		<li><a href="#">Strange sightings on the road</a></li>
		<li><a href="#">Route query: Delhi to Rajasthan</a></li>
		<li><a href="#">Bike trip: Mumbai to Goa</a></li>-->
	</ul>
</div>
	
		<div class="clearfix">
			<div class="fleft w420">
				<div class="primBlock marB10">
	<h3 class="TLR5"><span>Help Articles</span></h3><!-- code for this click event wriiten in home-news-->
	<div class="BLR5 primBlockPad">
		<ul class="marB10 normalList">
						<li><a href="/advice/logic-beauty-buying-1-3-year-old-used-cars" title="The logic &amp; beauty of buying 1 - 3 year old used cars">The logic & beauty of buying 1 - 3 year old used cars&hellip;</a></li>
						<li><a href="/advice/find-your-cars-date-manufacture-vin" title="Find your car&#039;s date of manufacture (VIN) ">Find your car's date of manufacture (VIN) </a></li>
						<li><a href="/advice/how-more-expensive-car-can-work-out-cheaper" title="How a more expensive car can work out cheaper">How a more expensive car can work out cheaper</a></li>
						<li><a href="/advice/how-sell-used-car-india" title="How to sell a *USED* car in India">How to sell a *USED* car in India</a></li>
						<li><a href="/advice/rto-hypothecation-removal-process-step-step-guide-0" title="RTO Hypothecation Removal Process - Step by Step Guide">RTO Hypothecation Removal Process - Step by Step Guide&hellip;</a></li>
						<!--  <li><a href="#">How to get the lowest EMI & the best finance deal.</a></li>
			<li><a href="#">How to protect your car from theft.</a></li>
			<li><a href="#">How to get the maximum Fuel Efficiency.</a></li>
			<li><a href="#">How to modify/ tune your car.</a></li>
			-->
		</ul>
		<div class="clearfix">
			<a title="View all" href="/advice" class="fright btnRight">
				<span>View All</span>
			</a>
		</div>
	</div><!-- primBlockPad -->
</div><!-- primBlock -->
		
				<div class="primBlock">
	<h3 class="tech_stuffspcl TLR5"><span>Tech Stuff</span></h3><!-- code for this click event wriiten in home-news-->
	<div class="BLR5 primBlockPad">
		<ul class="marB10 normalList">
						<li><a href="/tech-stuff/downside-high-end-audio-installs" title="The Downside of High-End Audio Installs">The Downside of High-End Audio Installs</a></li>
						<li><a href="/tech-stuff/all-about-engine-decarbonisation" title="All about Engine Decarbonisation">All about Engine Decarbonisation</a></li>
						<li><a href="/tech-stuff/fixing-car-steering-pedal-vibrations" title="Fixing Car / Steering / Pedal Vibrations">Fixing Car / Steering / Pedal Vibrations</a></li>
						<li><a href="/tech-stuff/how-maintain-your-car-top-shape" title="How to Maintain your Car in Top Shape">How to Maintain your Car in Top Shape</a></li>
						<li><a href="/tech-stuff/idling-rule-turbo-charged-cars" title="The &quot;Idling Rule&quot; with Turbo-Charged Cars">The "Idling Rule" with Turbo-Charged Cars</a></li>
						<!-- <li><a href="#">Suspension issues.</a></li>
			<li><a href="#">Nano technology in cars.</a></li>
			<li><a href="#">Torque & power graph of Indan cars.</a></li>
			<li><a href="#">Fuel gauge problems.</a></li> -->
		</ul>
		<div class="clearfix">
			<a title="View all" href="/tech-stuff" class="fright btnRight">
				<span>View All</span>
			</a>
		</div>
	</div><!-- primBlockPad -->
</div><!-- primBlock -->
			</div><!-- fleft -->
		
			<div class="fright w190">
				<div class="marB10">
	<a href="http://store.team-bhp.com/?utm_source=Portal&utm_medium=HomeMerchBox&utm_campaign=TBHP"><img class="disBlock" src="themes/bhp/images/home/teamBhpMerchandise.jpg" width="190" height="260" title="Team-BHP Merchandise" alt="Team-BHP Merchandise" /></a>
</div>
				<div class="roundAll5 safetyBlock">
	<ul>
					<li><a href="/safety/sleepy-driving-silent-killer-indian-roads" title="Sleepy Driving: The silent killer on Indian roads">Sleepy Driving: The sile&hellip;</a></li>
		 		<li><a href="/safety/open-vs-full-face-helmets" title="Open vs Full Face Helmets">Open vs Full Face Helmets</a></li>
		 		<li><a href="/safety/safe-driving-highways-ghats" title="Safe Driving on Highways &amp; Ghats">Safe Driving on Highways&hellip;</a></li>
		 		<li><a href="/safety/seat-belts-saved-my-life-stories-pictures" title="Seat Belts Saved My Life! Stories &amp; Pictures">Seat Belts Saved My Life&hellip;</a></li>
		 		<li><a href="/safety/tyre-bursts-blowouts-how-handle-and-prevent-them" title="Tyre Bursts / Blowouts : How to handle and prevent them">Tyre Bursts / Blowouts&hellip;</a></li>
		 		<!--  <li><a href="#">Child safety in  cars</a></li>
		<li><a href="#">Consectetur adip elit...</a></li>
		<li><a href="#">Adipiscing elit. </a></li>
		<li><a href="#">Consectetur adipiscing </a></li>-->
	</ul>
	<div class="padR10 clearfix">
		<a title="More" class="fright buttonSmall" href="/safety"><span>More </span></a>
	</div>
</div><!-- safetyBlock -->
			</div><!-- fright -->
		
		</div><!-- clearfix -->
	</div>
	<div id="sidebar1" class="fright">
		<script type="text/javascript">
(function ($) {
	$(function(){
	var vintageInt = setInterval(function(){
			  count1 ++;
			  if(count1==10){
			  	$j = $n+1;
					 count1 = 0;
					 
					 if($j<$("#vintageCars img").length)
					 	{	
					 		$("#vintageCars img").eq($n).fadeOut(500, function(){
					 			$("#vintageCars img").fadeOut(500);
								$("#vintageCars img").eq($j).fadeIn(500);
								$(".vintageBtn ul li").removeClass("active");
				   				$(".vintageBtn ul li").eq($j).addClass("active");
				   				$(".vintageCars h4").text($(this).next().attr("alt"));
				   				
			   				});
				   			
					 		$n = $n+1;
					 	}
					 else
					 	{
					 		$n=0;
					 		$("#vintageCars img").eq($("#vintageCars img").length-1).fadeOut(500, function(){
					 			$("#vintageCars img").fadeOut(500);
					 			$("#vintageCars img").eq(0).fadeIn(500);
					 			$(".vintageBtn ul li").removeClass("active");
				   				$(".vintageBtn ul li").eq(0).addClass("active");
				   				$(".vintageCars h4").text($("#vintage-1").attr("alt"))
			   				});
					 	}
					 }
			},1000);
			
			$(".vintageBtn ul li").click(function(){
				$listItem = $('.vintageBtn ul li').index(this);
				$(".vintageBtn ul li").removeClass("active");
				$(this).addClass("active");
				$("#vintageCars img").fadeOut(600);
				$($(this).attr("rel")).fadeIn(600);
				$bannerTitle = $(this).attr("rel");
				$(".vintageCars h4").text($($bannerTitle).attr("alt"));
				count1=0;
				$n=$listItem;
				return false;
			});
	});
})(jQuery);
</script>
<div class="marB10 homeThreads">
	<h3 class="TLR5" id="mtrbik">Motorbikes</h3><!-- code for this click event wriiten in home-news-->
	<div class="threadsList BLR5">
		<ul>
						<li><a href="https://www.team-bhp.com/forum/superbikes-imports/244532-sold-my-ninja-650-what-motorcycle-should-i-now-buy.html" target="_blank" title="Sold Ninja 650 | What bike?">Sold Ninja 650 | What bike?</a></li>
						<li><a href="https://www.team-bhp.com/forum/motorbikes/244398-ola-s1-electric-scooter-review-6.html#post5197136" target="_blank" title="More on the Ola S1 Scooter">More on the Ola S1 Scooter</a></li>
						<li><a href="https://www.team-bhp.com/forum/motorbikes/244504-new-suzuki-scooter-teased-launch-november-18-a.html" target="_blank" title="New Suzuki scooter teased">New Suzuki scooter teased</a></li>
						<li><a href="https://www.team-bhp.com/forum/motorbikes/244427-maxto-m3-review-bluetooth-headset-dvr-helmets.html" target="_blank" title="Review: Maxto M3 Headset">Review: Maxto M3 Headset</a></li>
						<li><a href="https://www.team-bhp.com/forum/motorbikes/244398-ola-s1-electric-scooter-review-6.html#post5196814" target="_blank" title="Ola S1 Scooter, continued">Ola S1 Scooter, continued</a></li>
						<!--  <li><a href="#">ABS for Bikes</a></li>
			<li><a href="#">Retro Style Kwasaki W800 Launched</a></li>
			<li><a href="#">Honda 250CC Bike for India</a></li>
			<li><a href="#">How to buy a good helmet?</a></li>
			-->
		</ul>
		<div class="marR15 clearfix">
		<a title="More bike threads" href="/?q=hot-threads&catname=Motorbikes" class="fright btnRight">
			<!-- <a href="/forum/motorbikes/" target="_blank" class="fright btnRight"> -->
				<span>More Bike Threads</span>
			</a>
		</div><!-- marR15 -->
	</div><!-- threadsList -->
</div><!-- homeThreads -->
		<div class="roundAll5 vintageCars">
	<div id="vintageCars" class="picBox">
				<a href="https://www.team-bhp.com/forum/gallery.php?catid=3" target="_blank">
		<img title="Vintage Cars in India" id="vintage-1" src="sites/default/files/vintageCars.jpg"  alt="Vintage Cars in India"/> 
		</a>
				<a href="https://www.team-bhp.com/forum/gallery.php?catid=2" target="_blank">
		<img title="Supercars in India" id="vintage-2" style="display:none" src="sites/default/files/superCar_0.jpg"  alt="Supercars in India"/> 
		</a>
				<a href="https://www.team-bhp.com/forum/gallery.php?catid=19" target="_blank">
		<img title="4x4 & Off-Roading" id="vintage-3" style="display:none" src="sites/default/files/4x4Car_8_0.jpg"  alt="4x4 & Off-Roading"/> 
		</a>
				<!--  <img id="vintage-2" style="display:none" src="themes/bhp/images/temp/4x4Car.jpg" width="280" height="228" alt="4 x 4 Cars"/>
		<img id="vintage-3" style="display:none" src="themes/bhp/images/temp/vintageCars.jpg" width="280" height="228" alt="Vintage Cars"/>-->
	</div>
	<div class="vintageBtn clearfix">
		<ul class="fright clearfix">
						<li rel="#vintage-1" class="active">&nbsp;</li>
						<li rel="#vintage-2">&nbsp;</li>
						<li rel="#vintage-3">&nbsp;</li>
						<!--  <li rel="#vintage-2">&nbsp;</li>
			<li rel="#vintage-3">&nbsp;</li>-->
		</ul>
	</div>
</div>
		<div class="searchClassi">
	<h3 class="TLR5">Buy & Sell Used Cars</h3>
	<div class="searchContent classifiedsAdAlt BLR5 searchContentOverride">
		<ul>
			<li><a href="https://classifieds.team-bhp.com/browse_by_body_style/Hatchback/" title="Hatchbacks">Hatchbacks</a></li>
			<li><a class="sedansAdAlt" href="https://classifieds.team-bhp.com/browse_by_body_style/Sedan/" title="Sedans">Sedans</a></li>
			<li><a class="SUVAdAlt" href="https://classifieds.team-bhp.com/browse_by_body_style/SUV,+MUV,+4x4/" title="SUVs, MUVs &amp; 4X4">SUVs, MUVs &amp; 4x4s</a></li>
			<li><a class="luxuryAdAlt" href="https://classifieds.team-bhp.com/browse_by_body_style/Luxury+&+Niche/" title="Luxury &amp; Niche">Luxury &amp; Niche</a></li>
			<li class="BLR5"><a class="motorbikesAdAlt" href="https://classifieds.team-bhp.com/search_results/?listing_type[equal]=Motorbikes&action=search" title="Motorbikes">Motorbikes</a></li>
		</ul>
	</div><!-- searchContent -->
</div><!-- searchClassi -->
	</div><!-- sidebar -->
</div></div></div></div>  </div>

  
  
</div>
  </div>
</div>
  </div>
				  			</div><!-- section -->
		</div> <!-- /#content -->
		
					

</div><!--  /#container -->

						<div id="footer-wrapper">
				<div class="section">
										
											  <div class="region region-footer">
    <div id="block-block-36" class="block block-block">

    
  <div class="content">
    <div id="footer" class="clearfix">
	<div class="clearfix">
		<div class="fleft w480">
			<h4>Team-BHP.com</h4>
			<ul class="fleft">
				<li><a href="/advice" title="Advice">Advice</a></li>
				<li><a href="https://classifieds.team-bhp.com/" title="Classifieds">Classifieds</a></li>
				<li><a href="/forum/" title="Forum">Forum</a></li>
				<li><a href="/hot-threads" title="Hot Threads">Hot Threads</a></li>
				<!--<li><a href="/forum/" title="Directory">Directory</a></li>-->
			</ul>
			<ul class="fleft">
				
				<li><a href="/news" title="News">News</a></li>
				<li><a href="/forum/gallery.php" title="Photos">Photos</a></li>
				<li><a href="/forum/official-new-car-reviews/?pp=25&sort=dateline&order=desc&daysprune=-1" title="Reviews">Reviews</a></li>
			</ul>
	
			<ul class="fleft">
				<li><a href="/safety" title="Road Safety">Road Safety</a></li>
				<li><a href="https://store.team-bhp.com/?utm_source=Portal&utm_medium=TextLink&utm_content=Footer&utm_campaign=TBHP" title="Store">Store</a></li>
				<li><a href="/tech-stuff" title="Tech Stuff">Tech Stuff</a></li>
			</ul>
		</div><!-- 480 -->
		
		<div class="fleft marL40 w160">
			<h4>About Us</h4>
			<ul class="fleft">
				<li><a href="/aboutus/overview" title="Overview">Overview</a></li>
				<li><a href="/aboutus/team" title="The Team">The Team</a></li>
				<li><a href="/aboutus/key-features" title="Key Features">Key Features</a></li>
				<li><a href="/aboutus/philosophy" title="Philosophy">Philosophy</a></li>
				<li><a href="/aboutus/history" title="History">History</a></li>			
			</ul>
		</div>
		<div class="fleft marL40 w100">
			<h4>Contact Us</h4>
			<ul class="fleft">
				<li><a href="/contactus/speak" title="Speak">Speak</a></li>
				<li><a href="/contactus/share" title="Share">Share</a></li>
				<li><a href="/contactus/advertise" title="Advertise">Advertise</a></li>
			</ul>
		</div><!-- w460 -->
		
	</div><!-- clearfix -->	
	<div class="clearfix">&nbsp;</div>

	<div class="clearfix marT40">
		<div class="fleft cRight">

            Copyright 2021 - www.team-bhp.com
        </div>
		<div class="fright marR40" id="footnote">
			<a href="/sitemap" title="Site Map">Site Map</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
			<a href="/privacy-policy" title="Privacy Policy">Privacy Policy</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
			<a href="/terms-conditions" title="Terms &amp; Conditions">Terms &amp; Conditions</a>
		</div>
	</div>
	
	<!-- Begin comScore Tag -->
	<script>
	  var _comscore = _comscore || [];
	  _comscore.push({ c1: "2", c2: "24416377" });
	  (function() {
		var s = document.createElement("script"), el = document.getElementsByTagName("script")[0]; s.async = true;
		s.src = (document.location.protocol == "https:" ? "https://sb" : "http://b") + ".scorecardresearch.com/beacon.js";
		el.parentNode.insertBefore(s, el);
	  })();
	</script>
	<noscript>
	  <img src="https://sb.scorecardresearch.com/p?c1=2&c2=24416377&cv=2.0&cj=1" />
	</noscript>
	<!-- End comScore Tag -->
	
	<!-- Switch to mobile site code -->
		
</div><!-- footer -->
<script type="text/javascript">

    function eraseCookie(name) {

        document.cookie = name + "=" + "0" + -1 + "; path=/";

        location.reload();
    }
</script>

<!-- QUORA FILTER - DO NOT MODIFY -->
<!-- END OF QUORA FILTER -->

<!-- Start Alexa Certified Metrics Javascript -->
<script type="text/javascript">
_atrk_opts = { atrk_acct:"AMUFv1Y1Mn20Io", domain:"team-bhp.com",dynamic: true};
(function() { var as = document.createElement('script'); as.type = 'text/javascript'; as.async = true; as.src = "https://certify-js.alexametrics.com/atrk.js"; var s = document.getElementsByTagName('script')[0];s.parentNode.insertBefore(as, s); })();
</script>
<noscript><img src="https://certify.alexametrics.com/atrk.gif?account=AMUFv1Y1Mn20Io" style="display:none" height="1" width="1" alt="" /></noscript>
<!-- End Alexa Certified Metrics Javascript -->

<!-- Include PushAlert Push Notification & Newsletter Modal Code -->
<!-- LocalStorage Visit Tracking -->
<script>
	// Visit tracking
	var currentTime = new Date().getTime();
	var currentVisitDay = Math.floor(currentTime / 86400000);
	
	if (!localStorage.TBHPPagesVisited)
	{	
		localStorage.setItem("TBHPPagesVisited", 1);
		localStorage.setItem("TBHPPagesTodayOnly", 1);
		localStorage.setItem("TBHPFirstVisitDay", currentVisitDay);
		localStorage.setItem("TBHPLastVisitDay", currentVisitDay);
		localStorage.setItem("TBHPCurrentVisitDayTemp", currentVisitDay);
	}
	else
	{
		localStorage.TBHPPagesVisited++;
		localStorage.TBHPPagesTodayOnly++;
		
		if (localStorage.TBHPCurrentVisitDayTemp != currentVisitDay)
		{
			localStorage.TBHPLastVisitDay = localStorage.TBHPCurrentVisitDayTemp;
			localStorage.TBHPCurrentVisitDayTemp = currentVisitDay;
			localStorage.TBHPPagesTodayOnly = 1;
		}
		
	}
</script>


<!-- PushAlert Push Notifications -->
<script type="text/javascript">
    // Standard PA code block
    (function(d, t) {
            var g = d.createElement(t),
            s = d.getElementsByTagName(t)[0];
            g.src = "https://cdn.pushalert.co/integrate_70f467dea7f27c184b928ef95e46b79f.js";
            s.parentNode.insertBefore(g, s);
    }(document, "script"));
    

    // Disable the Opt-In box for the first 7 pageviews of the day (Newsletter box is shown on 4th pv). 2021-11-10 change.
    if (localStorage.TBHPPagesTodayOnly < 8)
    {
        // disable the OptIn box
        (pushalertbyiw = window.pushalertbyiw || []).push(['disableAutoInit', true]);
    }


    // ON SUBSCRIBE set callback
    (pushalertbyiw = window.pushalertbyiw || []).push(['onSuccess', callbackOnSuccess]);

    // Add to all default segments
    function callbackOnSuccess(result) {
        // The user has JUST subscribed
        if (result.alreadySubscribed == false)
        {
            // Set NoPreferenceChosen flag
            (pushalertbyiw = window.pushalertbyiw || []).push(['addToSegment', 8399]);
            
            // Subscribe to DEFAULT segments (ht, news)
            (pushalertbyiw = window.pushalertbyiw || []).push(['addToSegment', 8562]);
            (pushalertbyiw = window.pushalertbyiw || []).push(['addToSegment', 8402]);
        }
    } 
</script>


<!-- Newsletter Modal Popup CSS -->
<style type="text/css" id="email-modal">
    .email-modal {
        display: none; /* Hidden by default */
        position: fixed; /* Stay in place */
        z-index: 100; /* Sit on top */
        padding-top: 20px; /* Location of the box */
        left: 0;
        top: 0;
        overflow: auto; /* Enable scroll if needed */
        width: 100%; 
        height: 100%;
    /*	background-color: rgb(0,0,0); */
    /*	background-color: rgba(0,0,0,0.4); */
        pointer-events: none; /* Enables clicking through of background stuff */
    }

    .email-modal-content {
        pointer-events: auto; /* IMPORTANT! Re-enables clicking of this div */
        position: relative;
        margin: auto;
        padding: 0;
        border: 1px solid #444;
        width: 90%;
        max-width: 550px;
        box-shadow: 0px 10px 34px 18px rgba(0,0,0,0.6), 0 20px 120px 70px rgba(0,0,0,0.1);
        -webkit-animation-name: animatetop;
        -webkit-animation-duration: 0.9s;
        animation-name: animatetop;
        animation-duration: 0.9s;
    }

    @-webkit-keyframes animatetop {
        from {top:-300px; opacity:0} 
        to {top:0; opacity:1}
    }

    @keyframes animatetop {
        from {top:-300px; opacity:0}
        to {top:0; opacity:1}
    }

    .email-modal-close {
        color: black;
        font-family: "Times New Roman";
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
        z-index: 101;
        
        position: absolute;
        background: white;
        top: -15px;
        right: -15px;
            
        border-radius: 50%;
        width: 30px;
        height: 30px;
        line-height: 30px;
        text-align: center;
        border: 2px solid grey;
    }

    .email-modal-title {
        display: block;
        color: white;
        font-size: 1.5em;
        margin-top: 1vh;
        margin-bottom: 2vh;
        font-weight: bold;
    }
    </style>

    <style type="text/css" id="mailchimp-hooks">
    #mc_embed_signup {
        background: linear-gradient(#4c4c4c, #101010) !important;
        clear:left; 
        font:14px Helvetica,Arial,sans-serif; 
    }	

    #mc_embed_signup form {
        display:block; /* Mozilla Private Window */
        position:relative; /* Mozilla Private Window */ 
        text-align:left; /* Mozilla Private Window */
        padding: 10px 7% 10px 7% !important;
    }

    #mc_embed_signup .mc-field-group {
        width: 100% !important;
        min-height: 0px !important;
        padding-bottom: 1.3vh !important;
    }

    #mc_embed_signup .mc-field-group input {
        width: 99%; /* Mozilla */
    }

    #mc_embed_signup .mce-clear {
        clear:both;
    }

    #mce-responses {
        margin: 0 !important;
    }

    #mce-success-response {
        background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAACXBIWXMAAAsTAAALEwEAmpwYAAAJTWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmJlYWUwODJkLTU5MzAtOTY0OC1hYjllLTMwMjFhMjU1Y2E1ZCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoxMzA4Mjk1Mi0zZjQwLTdkNGYtOGRhZi1lZTlkOWM1NTUyNDEiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0iODI0QkVGOUZGMzhFRDMyMUZFRTA4RUUxRjdGRDI2RTQiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0iIiB0aWZmOkltYWdlV2lkdGg9IjgyMCIgdGlmZjpJbWFnZUxlbmd0aD0iODMzIiB0aWZmOlBob3RvbWV0cmljSW50ZXJwcmV0YXRpb249IjIiIHRpZmY6U2FtcGxlc1BlclBpeGVsPSIzIiB0aWZmOlhSZXNvbHV0aW9uPSIxLzEiIHRpZmY6WVJlc29sdXRpb249IjEvMSIgdGlmZjpSZXNvbHV0aW9uVW5pdD0iMSIgZXhpZjpFeGlmVmVyc2lvbj0iMDIyMSIgZXhpZjpDb2xvclNwYWNlPSI2NTUzNSIgZXhpZjpQaXhlbFhEaW1lbnNpb249IjgyMCIgZXhpZjpQaXhlbFlEaW1lbnNpb249IjgzMyIgeG1wOkNyZWF0ZURhdGU9IjIwMjAtMDYtMDNUMTI6NTE6NDQrMDU6MzAiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTA2LTAzVDEyOjU0OjUxKzA1OjMwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTA2LTAzVDEyOjU0OjUxKzA1OjMwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MjY5YjdhNDUtN2NkMC0wNjQxLTg0MDAtYzY5MTAzY2QyNjAwIiBzdEV2dDp3aGVuPSIyMDIwLTA2LTAzVDEyOjU0OjUxKzA1OjMwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNvbnZlcnRlZCIgc3RFdnQ6cGFyYW1ldGVycz0iZnJvbSBpbWFnZS9qcGVnIHRvIGltYWdlL3BuZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iZGVyaXZlZCIgc3RFdnQ6cGFyYW1ldGVycz0iY29udmVydGVkIGZyb20gaW1hZ2UvanBlZyB0byBpbWFnZS9wbmciLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjEzMDgyOTUyLTNmNDAtN2Q0Zi04ZGFmLWVlOWQ5YzU1NTI0MSIgc3RFdnQ6d2hlbj0iMjAyMC0wNi0wM1QxMjo1NDo1MSswNTozMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoyNjliN2E0NS03Y2QwLTA2NDEtODQwMC1jNjkxMDNjZDI2MDAiIHN0UmVmOmRvY3VtZW50SUQ9IjgyNEJFRjlGRjM4RUQzMjFGRUUwOEVFMUY3RkQyNkU0IiBzdFJlZjpvcmlnaW5hbERvY3VtZW50SUQ9IjgyNEJFRjlGRjM4RUQzMjFGRUUwOEVFMUY3RkQyNkU0Ii8+IDx0aWZmOkJpdHNQZXJTYW1wbGU+IDxyZGY6U2VxPiA8cmRmOmxpPjg8L3JkZjpsaT4gPHJkZjpsaT44PC9yZGY6bGk+IDxyZGY6bGk+ODwvcmRmOmxpPiA8L3JkZjpTZXE+IDwvdGlmZjpCaXRzUGVyU2FtcGxlPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PgYBrTIAAAL5SURBVDiNfZRNTBNREMen1krbBQq0FCtijIkYTfyOgnwU+kWhChg4kBgvAmr8ACVRFOju9ktosXAxGo0XFEg06kU8aDiITSBEg5BgYjxpiB69aqKYcd5rKawVXjLZt2/f/HbmvfkPFNxugq33ToAxXAuGbhdYRA9kii6jTnS0aiTbkEqueM2M5g90ov00fTOZaY/RWw36UBVoox7Q9dcALIFM4TowdLkgXXIGVbL1B/jKEWQrEoQbm8ffrT/1krPXRCAh5Ia0JOhOE2y7fxLMkTqNqrtsEmQlQGG+SgSxFKGnCNdLtun0kFurG/BAWn81wMZoA1iijbAh4HgHUtn/AUlIGcLVfQjXDtJzL6qDrrncSB0wg01yLehFp49tWh1iQ/BSJM0m7IuN4tTCBw6CK7sxw+/u2+wjUJbszgTJukY6CcgpI7aNDeLS+Pj9K2o79yN0HUaD7M6GNNl+hkOYQ88R+ssensYypIRDLo4N4MoxNPsSNZ0HyKcYtbK9DdRy5SNg+XcXIVw/hPnRRoRLO1AVcCQiySHIoALSGxtBaDGTTzEyX2I8AfrzJIjl3PnW9DP8/WcRi+62cgC05GLbCyXkxpthvs5SYhHHS4MYNJmCc1uw+bky9MJeDx4f7VKshWIMYopD/LaVZznJUnvMrrPA78CJhXlcbcTTUUayVKjr5IqndNiOsxCgQ+3YidBeiONf5lIginSUkSArYLqwdsiS3AZ+/QF7ArYdxz/PLkNia0HIyNcgVxkhX6oFQXSGQCqN39RlgnXswplvn/Dh3CuEVnNKOkkQKSFddkV5QcYl0gAav+M9lwiDMRmwcmBSoOe/kcQh5aj22ebNkXrI7a8nEIm2gERritRpSbRvuWjJkddIT0lKJJA4F7XXOkOiFQSm/giJ1kJtJD/Zj5wgSM4wtYpf4LOmthEfbyOLtCea43WDEKwC/U0PCJGaZVB2+Bhk8cZ2lDW2PGpi5zVS5XCisU3QfITWLmR4nZY8amwMpA+6QEiA/gJPA0dBCS90pgAAAABJRU5ErkJggg==) no-repeat;
        background-position: 0% 65%;
        padding-left: 20px !important;
    }

    #mc_embed_signup .subButton {
        font-family: "Arial";
        background-color: #d00f15 !important;
        box-shadow: 1px 2px 0 0 #88080d !important;
        width: 100% !important;
        height: 38px !important;
        border: 0; /* Mozilla */
        margin: 0 5px 10px 0; /* Mozilla */
        color: white; /* Mozilla */
        border-radius: 5px; /* Mozilla & iOS */
        -webkit-appearance: none; /* iOS */
    }

    #mc_embed_signup .subButton:hover {
        background-color: #e20b12 !important;
    }

    .mcSamples {
        display: block;
        margin-top: 1vh;
        margin-bottom: 1vh;
        text-align: right;
    }

    .mcSamples a {
        font-size: 1em;
        color: #999; /* #d00f15 */
        text-decoration: none;
    }
</style>
        
<!-- Newsletter Email Modal pop-up -->
<div id="emailModal" class="email-modal">
    <div class="email-modal-content">
        <span class="email-modal-close">&times;</span>	
    
        <!-- VIDEO -->
        <video style="display:block; width:100%; height:auto;" poster="/newsletter/header-image-1x.jpg" autoplay loop muted playsinline> 
            <source src="/newsletter/newsletter-video-01.mp4" type="video/mp4">
            <img src="/newsletter/header-image-1x.jpg" title="No mp4 support">
        </video>		

        <!-- Begin Mailchimp Signup Form -->
        <link href="//cdn-images.mailchimp.com/embedcode/classic-10_7.css" rel="stylesheet" type="text/css">
        <div id="mc_embed_signup">
            <form action="https://team-bhp.us4.list-manage.com/subscribe/post?u=10e084528b02b3c554ebf47a8&amp;id=39df29de53" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_blank" novalidate>
                <div id="mc_embed_signup_scroll">
                    <span class="email-modal-title">Team-BHP's Daily Newsletter</span>
                    <div class="mc-field-group">
                        <!-- <label for="mce-EMAIL">Email Address:</label> -->
                        <input type="email" value="" name="EMAIL" class="required email" id="mce-EMAIL" placeholder="yourname@example.com">
                    </div>
                    <div id="mce-responses" class="mce-clear">
                        <div class="response" id="mce-error-response" style="display:none"></div>
                        <div class="response" id="mce-success-response" style="display:none"></div>
                    </div>    <!-- real people should not fill this in and expect good things - do not remove this or risk form bot signups-->
                    <div style="position: absolute; left: -5000px;" aria-hidden="true"><input type="text" name="b_10e084528b02b3c554ebf47a8_39df29de53" tabindex="-1" value=""></div>
                    <div class="mce-clear"><input type="submit" value="Subscribe" name="subscribe" id="mc-embedded-subscribe" class="subButton"></div>
                </div>
                <div class="mcSamples"><a target="_blank" href="https://us4.campaign-archive.com/home/?u=10e084528b02b3c554ebf47a8&id=39df29de53" title="View previous campaigns">View recent samples ►</a></div>			
            </form>
        </div>
        <script type='text/javascript' src='//s3.amazonaws.com/downloads.mailchimp.com/js/mc-validate.js'></script>
        <!-- Moving this code to external JS because the $mcj variable causes problems with vBulletin (which thinks its calling a template) -->
        <script src="/newsletter/mc_javascript.js"></script>	
        
        <!--End mc_embed_signup-->

    </div>
</div>


<!-- JS for Newsletter Subscribe Popup Modal -->
<script type="text/javascript">
    // Logic for whether to display the modal or not
    if (localStorage.TBHPPagesTodayOnly == 4)
    {
        // If (!ShowCount)
        // If shown once & first show was > 20 days ago
        // If shown > 2 & last shown > 45 days ago
        if ( (!localStorage.TBHPNewsletterModalShowCount) 
        || (localStorage.TBHPNewsletterModalShowCount == 1 && currentVisitDay - localStorage.TBHPNewsletterModalLastShown > 20) 
        || (localStorage.TBHPNewsletterModalShowCount > 1 && currentVisitDay - localStorage.TBHPNewsletterModalLastShown > 60) ) 
        {
            showModalThisTime();
        }
    }
    
    function modalCountUpdate()
    {
        if (!localStorage.TBHPNewsletterModalShowCount) { localStorage.setItem("TBHPNewsletterModalShowCount", 1); }
        else { localStorage.TBHPNewsletterModalShowCount++; }

        localStorage.setItem("TBHPNewsletterModalLastShown", currentVisitDay);
    }
        
    // Mechanics to display the modal	
    function showModalThisTime()
    {
        // MODAL SHOW/HIDE FUNCTIONS
            function showEmailModal() {
                modal.style.display = "block";
            }

            // Get the modal & span clos-btn, 
            var modal = document.getElementById("emailModal");
            var span = document.getElementsByClassName("email-modal-close")[0];

            // When the user clicks on <span> (x), close the modal
            span.onclick = function() {
                modal.style.display = "none";
            }			
        

        // SCROLL BASED TRIGGER FOR MODAL
            document.addEventListener("scroll", checkScrollProgress);
            function checkScrollProgress() {                    
                var scrolledSoFar = document.documentElement.scrollTop; // Can also use document.body.scrollTop
                
                // Halfway of ACTUAL scrollable area (Total page length - viewport height)/2
                var halfwayPoint = (document.documentElement.scrollHeight - document.documentElement.clientHeight)/2;
                
                if (scrolledSoFar > halfwayPoint)
                {
                    // Trigger modal
                    showEmailModal();
                    
                    // Update shown count
                    modalCountUpdate();
                    
                    // Remove event listener so this only fires once
                    document.removeEventListener("scroll", checkScrollProgress);
                }
            }
    }	
</script>
  </div>
</div>
  </div>
									</div><!-- section -->
			</div> <!--  /#footer-wrapper -->
		</div><!-- left page -->
	
				  <div id="sidebar-second" class="column sidebar">
		  	<div class="section">
				  <div class="region region-sidebar-second">
    <div id="block-block-28" class="block block-block">

    
  <div class="content">
    <div class="promoHolder">
		<img src="/sites/default/files/creta_4.jpg" alt="Creta"  />
</div>
  </div>
</div>
<div id="block-block-3" class="block block-block">

    
  <div class="content">
    <!-- Required space to the 970x250 billboard can break into this 2nd side column -->
<div class="billboardSpacer">
</div><div class="roundAll3 cta ibb-price-check" style="height:277px; margin-bottom:14px;">
	<h3>Sell Car in 1 Visit</h3>
	<div class="ibbSmallText padL15 padB5 padR10">Get the Best Price for Your Car</div>
	
	<div>
		<a href="https://www.cars24.com/mkt/?utm_source=teambhp&utm_medium=banner&utm_campaign=desktop" target="_blank" rel="sponsored" onclick="ga('secondTracker.send','event','Cars24_BannerBox', 'Portal')">
			<img class="roundAll5" src="../themes/bhp/images/cta/ibb-price-check/cars24-homepage-banner-1.jpg?v=4" alt="Powered by Cars24">
		</a>
	</div><!-- directoryList -->
</div>

<div class="roundAll3 cta ibb-price-check" style="height:257px; margin-bottom:14px;">
	<h3>Car Care</h3>
	<div class="ibbSmallText padL15 padB5 padR10">Tips from Turtle Wax</div>
	
	<div>
		<a href="https://www.amazon.in/stores/TurtleWax/page/1EBB2CC5-867A-4EF6-B10A-B23EAF14AF75?ref_=ast_bln" target="_blank" rel="sponsored" onclick="ga('secondTracker.send','event','TurtleWax_BannerBox', 'Portal')">
			<img class="roundAll5" src="../themes/bhp/images/cta/turtle-wax/turtle-wax-235x200.jpg?v=4">
		</a>
	</div>
</div>

<div class="roundAll3 cta ibb-price-check" style="height:257px; margin-bottom:14px;">
	<h3>Supercars</h3>
	<div class="ibbSmallText padL15 padB5 padR10">Pre-owned Luxury & Exotic cars</div>
	
	<div>
		<a href="https://www.bigboytoyz.com/collection" target="_blank" rel="sponsored" onclick="ga('secondTracker.send','event','Supercars_BannerBox', 'Portal')">
			<img class="roundAll5" src="../themes/bhp/images/cta/bigboytoyz/bbt-homepage-box-235x200.jpg?v=1">
		</a>
	</div>
</div>
  </div>
</div>
<div id="block-block-51" class="block block-block">

    
  <div class="content">
    <div class="roundAll3 cta ibb-price-check">
	<h3>Spare Parts</h3>

	<div>
  <a href="https://boodmo.com/?utm_source=team-bhp&utm_medium=static&utm_campaign=main" rel="nofollow" onclick="ga('secondTracker.send','event','Boodmo_HomepageBox', 'Portal')" target="_blank">
			<img class="roundAll5" src="../themes/bhp/images/cta/boodmo.png" alt="Spare Parts by Boodmo">
		</a>
	</div><!-- directoryList -->
</div><div class="roundAll3 cta featured-ads">
	<div class="padB10"><img src="/themes/bhp/images/cta/featured-ads/pre-owned-cars.png" alt="Feature Ads" width="198"  height="21" /></div>
		<div class="clearfix marB10">
		<div class="fleft imgBox">
			<a href="http://classifieds.team-bhp.com/buy-used/Mahindra/Scorpio/" target="_blank" title="Mahindra Scorpio">
				<img src="/sites/default/files/Mahindra Scorpio.jpg" alt="Mahindra Scorpio" />
			</a>
		</div><!-- w110 -->
		
		<div class="fleft imgDesc">
			<a href="http://classifieds.team-bhp.com/buy-used/Mahindra/Scorpio/" target="_blank" title="Mahindra Scorpio"><h4>Mahindra Scorpio</h4></a>
			<p><a href="http://classifieds.team-bhp.com/buy-used/Mahindra/Scorpio/" target="_blank" title="See All Ads">See All Ads</a></p>
		</div><!-- w90 -->
	</div><!-- clearfix -->
	
		<div class="clearfix marB10">
		<div class="fleft imgBox">
			<a href="http://classifieds.team-bhp.com/buy-used/Maruti/Wagon-R/" target="_blank" title="Maruti WagonR">
				<img src="/sites/default/files/wagonr.jpg" alt="Maruti WagonR" />
			</a>
		</div><!-- w110 -->
		
		<div class="fleft imgDesc">
			<a href="http://classifieds.team-bhp.com/buy-used/Maruti/Wagon-R/" target="_blank" title="Maruti WagonR"><h4>Maruti WagonR</h4></a>
			<p><a href="http://classifieds.team-bhp.com/buy-used/Maruti/Wagon-R/" target="_blank" title="See All Ads">See All Ads</a></p>
		</div><!-- w90 -->
	</div><!-- clearfix -->
	
	</div><!-- featured-ads -->
  </div>
</div>
<div id="block-block-33" class="block block-block">

    
  <div class="content">
    <div id="userContent" style="display:none">
<table cellpadding="0" cellspacing="0" width="100%">
	<tr>
		<td colspan="2" align="center" style="font-weight: bold">USERS ONLINE</td>
	</tr>
	<tr>
		<td colspan="2" align="center" style="font-size: 22px; letter-spacing:12px; padding: 8px 0 8px 0;">018832</td>
	</tr>
	<tr><td colspan="2"><hr /></td></tr>
	<tr>
		<td>Members:</td>
		<td style="font-weight: bold">70,833</td>
	</tr>
	<tr><td colspan="2"><hr /></td></tr>
	<tr>
		<td>Threads:</td>
		<td style="font-weight: bold">195,001</td>
	</tr>
	<tr><td colspan="2"><hr /></td></tr>
	<tr>
		<td>Posts:</td>
		<td style="font-weight: bold">4,965,220</td>
	</tr>
	<tr><td colspan="2"><hr /></td></tr>
</table></div>
<div class="roundAll3 cta userOnline clearfix">
	<h5 class="aln_center paB5">USERS ONLINE</h5>
	<div class="userCount">
		<ul class="clearfix">
			<li>0</li>
			<li>0</li>
			<li>0</li>
			<li>0</li>
			<li class="last">0</li>
		</ul><!-- userCount -->
	</div>
	<div class="siteStats">
		<ul>
			<li class="clearfix">
				<span>Members:</span>
				<strong>&nbsp;</strong>
			</li>
			<li class="clearfix">
				<span>Threads:</span>
				<strong>&nbsp;</strong>
			</li>
			<li class="clearfix last">
				<span>Posts:</span>
				<strong>&nbsp;</strong>
			</li>
		</ul><!-- siteStats -->
	</div>
</div>
  </div>
</div>
<div id="block-block-12" class="block block-block">

    
  <div class="content">
    <div class="roundAll3 cta directory">
	<h3>Directory</h3>
	<div class="findInDIR padL15 padB5">Member-recommended garages, shops &amp; service providers</div>
	
	<div class="roundAll5 directoryList clearfix">
		<ul>
			<li><a href="/forum/mumbai/" target="_blank" title="Mumbai">Mumbai</a></li>
			<li><a href="/forum/bangalore/" title="Bangalore" target="_blank" >Bangalore</a></li>
			<li><a href="/forum/delhi-ncr/" title="Delhi NCR" target="_blank" >Delhi NCR</a></li>
			<li><a href="/forum/chennai/" title="Chennai" target="_blank" >Chennai</a></li>
			<li><a href="/forum/other-cities/" title="Other Cities" target="_blank" >Other Cities</a></li>
			<!--<li><a href="/forum/other-cities/" title="Pune" target="_blank" >Pune</a></li>
			<li><a href="/forum/other-cities/" title="Kolkatta" target="_blank" >Kolkatta</a></li>
			<li><a href="/forum/other-cities/" title="Hyderabad" target="_blank" >Hyderabad</a></li>
			<li class="last"><a href="/forum/other-cities/" title="Cochin" target="_blank" >Cochin</a></li>-->
		</ul>
	</div><!-- directoryList -->
</div>


  </div>
</div>
<div id="block-block-4" class="block block-block">

    
  <div class="content">
    <div class="roundAll3 cta travelogues clearfix">
	<div class="traveloguesInner roundAll5">
		<div class="traveloguesContent">
			<p>&nbsp;</p>
		</div>
		<a href="https://store.team-bhp.com/?utm_source=Portal&utm_medium=Home3rdColumn&utm_campaign=TBHP" target="_blank">
			<img class="roundAll5" src="/sites/default/files/Merchandise-banner-Jan-13.jpg" alt="public://Merchandise-banner-Jan-13.jpg" />
		</a>
	</div>
</div><!-- Travelogues CTA -->
  </div>
</div>
<div id="block-block-24" class="block block-block">

    
  <div class="content">
    

<div class="roundAll3 cta newsletter clearfix">
	<div class="newsletterInner">
		<h3>Newsletter</h3>
		<div class="marB20">Get your daily update on <br />the Indian Car Scene. <br /><br /><a style="color:#CCCCCC; text-decoration:underline;" target="_blank" href="https://us4.campaign-archive.com/home/?u=10e084528b02b3c554ebf47a8&id=39df29de53">View recent sample</a></div>

		<form action="//team-bhp.us4.list-manage.com/subscribe/post?u=10e084528b02b3c554ebf47a8&amp;id=39df29de53" method="post"  id="mc_newsletter" name="mc_newsletter" class="mc_validate" novalidate>
			
		<div>
				<label for="mce-EMAIL">Email Address</label>
				<input type="email" value=""  size="23" name="EMAIL" class="required email" id="mce-EMAIL">
		</div>

		<p class="marT10"></p>
			
			<div class="aln_center clearfix marT20">
				
				<div class="clear"><input type="submit" value="Subscribe" name="subscribe" id="mc-embedded-subscribe" style="padding:2px;"></div>
				</form>
			</div><!-- submit button -->
		</form>
	</div><!-- newsletter inner -->
		<a class="unsubscribeLink" href="//team-bhp.us4.list-manage.com/unsubscribe?u=10e084528b02b3c554ebf47a8&id=39df29de53">Click here to unsubscribe</a>
	</div>
	
	<div class="roundAll3 cta socialMediaBlock clearfix">
			<h3> Become A Fan </h3>
			<div class="fb-like-box" data-href="https://www.facebook.com/teambhp" data-width="205" data-height="270" data-colorscheme="dark" data-show-faces="true" data-border-color="#626262" data-stream="false" data-header="false"></div>
		<div class="clearfix marT20 padL10">
		<h3 class="stayUpdated">Stay Updated</h3>
			<p><!-- Be updated about the Indian automotive scene via Twitter, Facebook or RSS feeds. -->Keep yourself tuned in to the Indian automotive scene via Twitter, Youtube or RSS feeds.</p>
			
			<ul class="stayUpdated marT20 marB10 clearfix">
				<li><a href="https://instagram.com/teambhp" title="Instagram" class="instagram" target="_blank">&nbsp;</a></li>
				<li><a href="https://twitter.com/#!/teambhpforum" title="Twitter" class="twitter" target="_blank">&nbsp;</a></li>
				<li><a href="https://www.youtube.com/teamBHPChannel" title="Youtube" class="youTube" target="_blank">&nbsp;</a></li>
				<li><a href="/rss-feed" title="RSS" class="rss" target="_blank">&nbsp;</a></li>			
			</ul>
		
	</div><!-- staty -->
	
	
</div><!-- Travelogues CTA -->  </div>
</div>
  </div>
		  	</div>
		</div> <!-- /.section, /#sidebar-second -->
		<div class="aln_center buckle">
		<img class="marT20" src="/sites/default/files/RedliningTheAutomotiveScene.gif" alt="Redlining the Indian Scene" />
	</div>
				</div> <!-- /#page, /#page-wrapper -->
	
	<!-- /1063105/desktopsliderportal -->
	<div id='div-gpt-ad-1633587773151-0' style='min-width: 300px; min-height: 250px;'>
	  <script>
		googletag.cmd.push(function() { googletag.display('div-gpt-ad-1633587773151-0'); });
	  </script>
	</div>
	<!-- end of /1063105/desktopsliderportal -->
	
</div><!-- page wrapper -->
  </div> <!-- bgholder -->
</body>
</html>
