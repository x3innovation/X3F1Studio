function ToastRenderer()
{
	Bullet.on('App>>user-logged-in', 'toast-renderer.js>>user-logged-in', function(){
        toast('Success : Log In', 2000);
    });

    Bullet.on('App>>user-log-in-fail', 'toast-renderer.js>>user-log-in-fail', function(){
        toast('Fail : Log In', 2000);
    });
}

module.exports = new ToastRenderer();