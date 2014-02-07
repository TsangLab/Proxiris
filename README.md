Proxiris
========

Workgroup annotation

This is the developing Proxiris project, focused on workgroup annotation in a
team consisting of software and human agents. 

It is built with Node.js and ElasticSearch, and uses the Faye pub-sub
implementation to couple components, as well as a proxy that links the server
to browsers without use of a plugin. We are very excited to link to Open
Annotation efforts and re-use elements from other OA projects.

This version is focused on closed workgroups, so security is all-or-nothing once logged in.

The overall system focuses on a component oriented design, so much of the code
developed in the project is located in other npm modules. In particular, see
the http://www.github.com/Vid/SenseBase project. This repository will include code directly
focused on TsangLab elements.

