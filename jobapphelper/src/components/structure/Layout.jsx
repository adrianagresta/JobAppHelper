import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import './Layout.css';
import MenuBar from './MenuBar';
import { registerContentSetter, unregisterContentSetter, consumePendingContent } from './contentService';
import HomeContent from '../content/HomeContent';

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

function Layout({ title, header, children, footer, className }) {
    const [content, setContent] = useState(() => consumePendingContent() || <HomeContent />);

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

    useEffect(() => {
        // register content setter so other modules can change content
        registerContentSetter(setContent);
        return () => unregisterContentSetter(setContent);
    }, [setContent]);

    return (
        <div className={`app-layout ${className || ''}`.trim()}>
            <header className="layout-header" role="banner" aria-label="Application header">
                {header}
            </header>

            <nav className="layout-menu" aria-label="Application menu">
                <MenuBar />
            </nav>

            <main className="layout-main" role="main">
                <section className="layout-content" aria-label="Application content">
                    {content || children}
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
    footer: PropTypes.node,
    sidebar: PropTypes.node,
    children: PropTypes.node,
    className: PropTypes.string,
};

export default Layout;