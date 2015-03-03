function ToastRenderer()
{
	Bullet.on('App>>user-logged-in', 'toast-renderer.js>>user-logged-in', function(){
        toast('Success : Log In', 2000);
    });
}

module.exports = new ToastRenderer();