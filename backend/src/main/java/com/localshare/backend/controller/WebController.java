package com.localshare.backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class WebController {

    @RequestMapping(value = {
            "/{path:^(?!api$)(?!assets$)(?!static$)(?!webjars$)(?!images$)(?!socket\\.io)(?!socket\\.io/.*)([^\\.]+)$}",
            "/{path:^(?!api$)(?!assets$)(?!static$)(?!webjars$)(?!images$)(?!socket\\.io)(?!socket\\.io/.*)([^\\.]+)}/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}