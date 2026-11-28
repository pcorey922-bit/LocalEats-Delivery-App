package com.rocoeats.app;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle savedInstanceState){
        String identity=getPackageName();
        if(identity.equals("com.rocoeats.driver")||identity.equals("com.rocoeats.driver.staging")){
            try{registerPlugin(Class.forName("com.rocoeats.app.NativeClerkPlugin").asSubclass(Plugin.class));}
            catch(ClassNotFoundException failure){throw new IllegalStateException("Native Driver authentication missing",failure);}
        }
        super.onCreate(savedInstanceState);
    }
}
