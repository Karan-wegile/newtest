<?php if( file_exists( get_stylesheet_directory().'/jedi-apprentice/jedi-apprentice-import.php' ) && !defined('JEDI_APPRENTICE_PATH') ) {include_once( get_stylesheet_directory().'/jedi-apprentice/jedi-apprentice-import.php' );} ?><?php
/**
 * Divi LMS Child Theme for LearnDash by Pee-Aye Creative
 * Functions.php
 *
 * ===== NOTES ==================================================================
 * 
 * New to Divi? Take our full Divi course: https://www.peeayecreative.com/product/beyond-the-builder-the-ultimate-divi-website-course/
 * 
 * Learn cool tricks and features with our Divi tutorials: https://www.peeayecreative.com/blog/
 * 
 * Discover our premium Divi products: https://www.peeayecreative.com/shop/
 * 
 * =============================================================================== */
 
function divichild_enqueue_scripts() {
    wp_enqueue_style( 'parent-style', get_template_directory_uri() . '/style.css' );
    wp_enqueue_script( 'custom-js', get_stylesheet_directory_uri() . '/js/scripts.js', array( 'jquery' ), '1.0.0' , true );
}
add_action( 'wp_enqueue_scripts', 'divichild_enqueue_scripts' );


/*function admin_default_page() {
  return '/my-profile';
}

add_filter('login_redirect', 'admin_default_page');*/


add_action('admin_menu', 'remove_by_caps_admin_menu');

function remove_by_caps_admin_menu(){
    if( !current_user_can( 'administrator' ) ){
        remove_menu_page( 'index.php' );
    }
}
//allow redirection, even if my theme starts to send output to the browser
add_action('init', 'do_output_buffer');
function do_output_buffer() {
        ob_start();
}
function my_custom_function() {
    global $wp;
    $request = explode( '/', $wp->request );
    if(  ( end($request) == 'my-account' && is_account_page() ) ){ 
       if ( is_user_logged_in() ) {
         wp_redirect( '"'.home_url().'/my-profile/"', 301 );
       }else{
          wp_redirect( '"'.home_url().'/#login"', 301 );  
       }
     }
    
     
}
add_action( 'wp_head', 'my_custom_function' );

add_shortcode( 'dynamic_content', function () {
	global $post;

	if ( ! $post ) {
		return '';
	}

	$courseid = learndash_get_course_id();
	$value = get_field( "course_short_description", $courseid );
    $coursecontent = $value;
    return $coursecontent;

} );

add_shortcode( 'dynamic_instructor', function () {
	global $post;

	if ( ! $post ) {
		return '';
	}

	$courseid = learndash_get_course_id();
	$value = get_field( "instructor", $courseid );
    $coursecontent = $value;
    return $coursecontent;

} );

add_shortcode( 'lmscoder_course_price', function () {
	global $post;
	if ( ! $post ) {
		return '';
	}
	$courseid = learndash_get_course_id();
	$price = learndash_get_course_meta_setting($courseid, 'course_price');
	return "<p class='leprice'>$".$price."</p>";
} );

add_shortcode( 'shot_cont', function () {
	global $post;

	if ( ! $post ) {
		return '';
	}

	$courseid = learndash_get_course_id();
	$content = get_post_field('post_content', $courseid);
	$content = strip_tags($content);
    return substr($content, 0, 200);
	

} );

add_shortcode( 'bread', function () {
	global $post;

	if ( ! $post ) {
		return '';
	}

	$courseid = learndash_get_course_id();
	$course = get_post($course_id);
    $coursetitle =  $course->post_title;
    $html = "<nav aria-label='Breadcrumb' class='sfwd-breadcrumbs clr lms-breadcrumbs '> <div class='breadcrumb-trail'><span itemscope=' itemtype='http://schema.org/Breadcrumb'><a href='".site_url()."' title='Home' rel='home' class='trail-begin'><span itemprop='Home'>Home</span></a></span><span class='sep'> » </span><span itemscope=' itemtype='http://schema.org/Breadcrumb'><a href='".site_url('all-courses')."' title='Courses' rel='courses' class='trail-begin'><span itemprop='Courses'>Courses</span></a></span><span class='sep'> » </span><span itemscope=' itemtype='http://schema.org/Breadcrumb'><span itemprop='Courses'>".$coursetitle."</span></span></div></nav>";	
    return $html;
} );

function your_prefix_redirect() {
    wp_redirect(site_url());
    die;
}
add_action('wp_logout', 'your_prefix_redirect', PHP_INT_MAX);


function themeslug_enqueue_style() {
    wp_enqueue_style( 'core', get_stylesheet_directory_uri() . '/my-style.css', false ); 
}
 
function themeslug_enqueue_script() {
    wp_enqueue_script( 'my-js', get_stylesheet_directory_uri() .'/filename.js', array( 'jquery' ), '1.0.0', true  );
}
 
add_action( 'login_enqueue_scripts', 'themeslug_enqueue_style', 10 );
add_action( 'login_enqueue_scripts', 'themeslug_enqueue_script', 1 );

add_action('admin_head', 'my_custom_fonts');

function my_custom_fonts() {
  echo '<style>
    .post-type-post #featured-video-plus-box{
      display:none;
    } 
    .post-type-post #postimagediv{
      display:none;
    } 
  </style>';
}

function wpb_demo_shortcode() { 
 $args = array(
'post_type'=> 'post',
'orderby'    => 'ID',
'post_status' => 'publish',
'order'    => 'DESC',
'posts_per_page' => -1 // this will retrive all the post that is published 
);
$result = new WP_Query( $args ); 
$message = "<div class = 'controller'>"; 
$message .= "<div class = 'row'>"; 
$message .= "<div class = 'col-md-12'>";

foreach($result->posts as $repo){
  $value = get_field( "video_url", $repo->ID );
  $message .= "<div class = 'col-md-4'>";  
  $message .= "<h2>".$repo->post_title."</h2>"; 
  $message .= "<iframe  src='https://www.youtube.com/embed/".$value."'></iframe>";     
  
  $message .= "</div><br><br>"; 
}
$message .= "</div>"; 
$message .= "</div>"; 
$message .= "</div>"; 
 
 return $message;
}
add_shortcode('greeting', 'wpb_demo_shortcode');







