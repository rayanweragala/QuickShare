package com.quickshare.backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class WebController {

    @RequestMapping(value = {
            "/{path:^(?!api$)(?!assets$)(?!static$)(?!webjars$)(?!images$)[^\\.]+$}",
            "/{path:^(?!api$)(?!assets$)(?!static$)(?!webjars$)(?!images$)[^\\.]+}/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
