<?php

declare(strict_types=1);

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Zend\Authentication\AuthenticationService;
use Zend\Diactoros\Response\RedirectResponse;
use Zend\Diactoros\Response\JsonResponse;

class CheckAuthMiddleware implements MiddlewareInterface
{
    private $auth;

    public function __construct(AuthenticationService $auth)
    {
        $this->auth = $auth;
    }

    /**
     * {@inheritDoc}
     */
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler) : ResponseInterface
    {
        $identity = $request->getAttribute(InjectAuthMiddleware::class);

        if (empty($identity)) {
            // return new RedirectResponse('/login');
            return new JsonResponse([
                'error' => 'Usuário não autenticado',
                'message' => 'É necessário fazer login para acessar este recurso.'
            ], 401);
        }

        return $handler->handle($request);
    }
}
