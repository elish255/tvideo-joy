/* eslint-disable */
// @ts-nocheck
import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as VideoVideoIdRouteImport } from './routes/video/$videoId'
import { Route as RegisterRouteImport } from './routes/register'
import { Route as LoginRouteImport } from './routes/login'
import { Route as PaymentRouteImport } from './routes/payment'
import { Route as AdminRouteImport } from './routes/admin'

const IndexRoute = IndexRouteImport.update({ id:'/', path:'/', getParentRoute:()=>rootRouteImport } as any)
const VideoVideoIdRoute = VideoVideoIdRouteImport.update({ id:'/video/$videoId', path:'/video/$videoId', getParentRoute:()=>rootRouteImport } as any)
const RegisterRoute = RegisterRouteImport.update({ id:'/register', path:'/register', getParentRoute:()=>rootRouteImport } as any)
const LoginRoute = LoginRouteImport.update({ id:'/login', path:'/login', getParentRoute:()=>rootRouteImport } as any)
const PaymentRoute = PaymentRouteImport.update({ id:'/payment', path:'/payment', getParentRoute:()=>rootRouteImport } as any)
const AdminRoute = AdminRouteImport.update({ id:'/admin', path:'/admin', getParentRoute:()=>rootRouteImport } as any)

export interface FileRoutesByFullPath {'/':typeof IndexRoute;'/video/$videoId':typeof VideoVideoIdRoute;'/register':typeof RegisterRoute;'/login':typeof LoginRoute;'/payment':typeof PaymentRoute;'/admin':typeof AdminRoute}
export interface FileRoutesByTo extends FileRoutesByFullPath {}
export interface FileRoutesById {'__root__':typeof rootRouteImport;'/':typeof IndexRoute;'/video/$videoId':typeof VideoVideoIdRoute;'/register':typeof RegisterRoute;'/login':typeof LoginRoute;'/payment':typeof PaymentRoute;'/admin':typeof AdminRoute}
export interface FileRouteTypes {fileRoutesByFullPath:FileRoutesByFullPath;fullPaths:'/'|'/video/$videoId'|'/register'|'/login'|'/payment'|'/admin';fileRoutesByTo:FileRoutesByTo;to:'/'|'/video/$videoId'|'/register'|'/login'|'/payment'|'/admin';id:'__root__'|'/'|'/video/$videoId'|'/register'|'/login'|'/payment'|'/admin';fileRoutesById:FileRoutesById}
export interface RootRouteChildren {IndexRoute:typeof IndexRoute;VideoVideoIdRoute:typeof VideoVideoIdRoute;RegisterRoute:typeof RegisterRoute;LoginRoute:typeof LoginRoute;PaymentRoute:typeof PaymentRoute;AdminRoute:typeof AdminRoute}
declare module '@tanstack/react-router' { interface FileRoutesByPath {
'/':{id:'/';path:'/';fullPath:'/';preLoaderRoute:typeof IndexRouteImport;parentRoute:typeof rootRouteImport}
'/video/$videoId':{id:'/video/$videoId';path:'/video/$videoId';fullPath:'/video/$videoId';preLoaderRoute:typeof VideoVideoIdRouteImport;parentRoute:typeof rootRouteImport}
'/register':{id:'/register';path:'/register';fullPath:'/register';preLoaderRoute:typeof RegisterRouteImport;parentRoute:typeof rootRouteImport}
'/login':{id:'/login';path:'/login';fullPath:'/login';preLoaderRoute:typeof LoginRouteImport;parentRoute:typeof rootRouteImport}
'/payment':{id:'/payment';path:'/payment';fullPath:'/payment';preLoaderRoute:typeof PaymentRouteImport;parentRoute:typeof rootRouteImport}
'/admin':{id:'/admin';path:'/admin';fullPath:'/admin';preLoaderRoute:typeof AdminRouteImport;parentRoute:typeof rootRouteImport}
}}
const rootRouteChildren:RootRouteChildren={IndexRoute,VideoVideoIdRoute,RegisterRoute,LoginRoute,PaymentRoute,AdminRoute}
export const routeTree=rootRouteImport._addFileChildren(rootRouteChildren)._addFileTypes<FileRouteTypes>()
import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' { interface Register {ssr:true;router:Awaited<ReturnType<typeof getRouter>>;config:Awaited<ReturnType<typeof startInstance.getOptions>>} }
