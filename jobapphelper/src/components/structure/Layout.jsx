import React, { useEffect } from "react";
import PropTypes from "prop-types";
import './Layout.css';

/**
 * Generic app layout component.
 *
 * Props:
 * - title: optional document title to set when mounted
 * - header: optional React node to render in the header area
 * - menu: optional React node to render in the menu area
 * - children: content area (preferred) or use `content` prop
 * - footer: optional React node to render in the footer area
 * - sidebar: optional React node to render in the sidebar
 * - className: optional additional className for root
 */

function Layout({ title, header, menu, children, footer, sidebar, className }) {
    useEffect(() => {
        if (title) {
            const prev = document.title;
            document.title = title;
            return () => {
                document.title = prev;
            };
        }
        return undefined;
    }, [title]);

    return (
        <div className={`app-layout ${className || ''}`.trim()}>
            <header className="layout-header" role="banner" aria-label="Application header">
                {header}
            </header>

            <nav className="layout-menu" aria-label="Application menu">
                {menu}
            </nav>

            <main className="layout-main" role="main">
                <aside className="layout-sidebar" aria-label="Application sidebar">
                    {sidebar}
                </aside>

                <section className="layout-content" aria-label="Application content">
                    {children}
                </section>
            </main>

            <footer className="layout-footer" role="contentinfo" aria-label="Application footer">
                {footer || <span>© {new Date().getFullYear()} JobAppHelper</span>}
            </footer>
        </div>
    );
}

Layout.propTypes = {
    title: PropTypes.string,
    header: PropTypes.node,
    menu: PropTypes.node,
    footer: PropTypes.node,
    sidebar: PropTypes.node,
    children: PropTypes.node,
    className: PropTypes.string,
};

export default Layout;