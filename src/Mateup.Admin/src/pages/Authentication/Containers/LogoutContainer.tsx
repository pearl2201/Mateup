import { ApplicationPaths, QueryParameterNames } from '@/constants/ApiAuthorizationConstants';
import type { AuthorizeState } from '@/services/authorize';
import authService, { AuthenticationResultStatus } from '@/services/authorize';
import React from 'react';

import styles from './index.less';

export const LogoutActions = {
    LogoutCallback: 'logout-callback',
    Logout: 'logout',
    LoggedOut: 'logged-out'
};
type LogoutActionType = 'logout' | 'logout-callback' | 'logged-out';

export interface LogoutContainerProps {
    action: LogoutActionType
}

export interface LogoutContainerState {
    message?: string;
    isReady: boolean;
    authenticated: boolean;
}

class LogoutContainer extends React.Component<LogoutContainerProps, LogoutContainerState>{
    constructor(props: LogoutContainerProps) {
        super(props);

        this.state = {
            message: undefined,
            isReady: false,
            authenticated: false
        };
    }

    componentDidMount() {
        const { action } = this.props;
        switch (action) {
            case LogoutActions.Logout:
                console.log(window.history);
                if (window.history.state.state && window.history.state.state.local) {
                    this.logout(this.getReturnUrl());
                } else {
                    this.logout(this.getReturnUrl());
                    // This prevents regular links to <app>/authentication/logout from triggering a logout
                    this.setState({ isReady: true, message: "The logout was not initiated from within the page." });
                }
                break;
            case LogoutActions.LogoutCallback:
                this.processLogoutCallback();
                break;
            case LogoutActions.LoggedOut:
                this.setState({ isReady: true, message: "You successfully logged out!" });
                break;
            default:
                throw new Error(`Invalid action '${action}'`);
        }

        this.populateAuthenticationState();
    }

    render() {
        const { isReady, message } = this.state;
        return <div>aabbaaaaaaaaaaaaaaaaaaaaaaaaaaaaa</div>
        if (!isReady) {
            return <div>aabb</div>
        }
        if (message) {
            return (<div>{message}</div>);
        }
        const { action } = this.props;
        console.log(action);
        switch (action) {
            case LogoutActions.Logout:
                return (<div>Processing logout</div>);
            case LogoutActions.LogoutCallback:
                return (<div>Processing logout callback</div>);
            case LogoutActions.LoggedOut:
                // return (<div>{message}</div>);
                return (<div>aabb</div>);
            default:
                throw new Error(`Invalid action '${action}'`);
        }

    }

    async logout(returnUrl: string) {
        const state = { returnUrl };
        const isauthenticated = await authService.isAuthenticated();
        if (isauthenticated) {
            const result = await authService.signOut(state);
            switch (result.status) {
                case AuthenticationResultStatus.Redirect:
                    break;
                case AuthenticationResultStatus.Success:
                    await this.navigateToReturnUrl(returnUrl);
                    break;
                case AuthenticationResultStatus.Fail:
                    this.setState({ message: result.message });
                    break;
                default:
                    throw new Error("Invalid authentication result status.");
            }
        } else {
            this.setState({ message: "You successfully logged out!" });
        }
    }

    async processLogoutCallback() {
        const url = window.location.href;
        const result = await authService.completeSignOut(url);
        switch (result.status) {
            case AuthenticationResultStatus.Redirect:
                // There should not be any redirects as the only time completeAuthentication finishes
                // is when we are doing a redirect sign in flow.
                throw new Error('Should not redirect.');
            case AuthenticationResultStatus.Success:
                await this.navigateToReturnUrl(this.getReturnUrl(result.state));
                break;
            case AuthenticationResultStatus.Fail:
                this.setState({ message: result.message });
                break;
            default:
                throw new Error("Invalid authentication result status.");
        }
    }

    async populateAuthenticationState() {
        const authenticated = await authService.isAuthenticated();
        this.setState({ isReady: true, authenticated });
    }

    getReturnUrl(state?: AuthorizeState) {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get(QueryParameterNames.ReturnUrl);
        if (fromQuery && !fromQuery.startsWith(`${window.location.origin}/`)) {
            // This is an extra check to prevent open redirects.
            throw new Error("Invalid return url. The return url needs to have the same origin as the current page.")
        }
        return (state && state.returnUrl) ||
            fromQuery ||
            `${window.location.origin}${ApplicationPaths.LoggedOut}`;
    }

    navigateToReturnUrl(returnUrl: string) {
        return window.location.replace(returnUrl);
    }
}

export default LogoutContainer;